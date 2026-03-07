import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import csv from 'csv-parser'; // Need to install csv-parser

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = '/tmp/leetcode-questions';

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function addAcceptanceRateColumn() {
  console.log("Checking if acceptance_rate column exists...");
  // Try a select query to see if it fails
  const { error } = await supabase.from('questions').select('acceptance_rate').limit(1);
  if (error && error.code === '42703') { // column does not exist
    console.log("Adding acceptance_rate column...");
    // We can't easily alter table via client if no RPC exists, but we can try if there's SQL func,
    // otherwise we might just skip it or log it. Since Supabase client is REST, DDL needs SQL editor.
    // Instead of altering, we will just not insert acceptance_rate if we don't have DDL access.
    // Let's rely on user to run it or just skip acceptance_rate. Let's try to add it using a raw query if possible (not possible via normal REST).
    console.log("WARNING: Please run `ALTER TABLE questions ADD COLUMN acceptance_rate text;` in Supabase SQL editor if you want to store it.");
    return false;
  }
  return true;
}

// Convert "slug" formats like "american-express" to "American Express"
function formatCompanyName(slug) {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function main() {
  const hasAcceptanceCol = await addAcceptanceRateColumn();

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found at ${DATA_DIR}. Please clone the repo first.`);
    process.exit(1);
  }

  const items = fs.readdirSync(DATA_DIR);
  const companyFolders = items.filter(item => {
    const stats = fs.statSync(path.join(DATA_DIR, item));
    return stats.isDirectory() && !item.startsWith('.');
  });

  console.log(`Found ${companyFolders.length} company folders.`);

  // Load existing companies to avoid duplicates
  const { data: existingCompanies, error: compErr } = await supabase.from('companies').select('id, slug');
  if (compErr) {
    console.error("Error fetching companies:", compErr);
    return;
  }
  const companyMap = new Map();
  existingCompanies.forEach(c => companyMap.set(c.slug, c.id));

  let totalQuestionsInserted = 0;

  for (const slug of companyFolders) {
    let companyId = companyMap.get(slug);

    if (!companyId) {
      // Create company
      const name = formatCompanyName(slug);
      console.log(`Creating company: ${name} (${slug})`);
      const { data: newComp, error: newCompErr } = await supabase
        .from('companies')
        .insert({
          name: name,
          slug: slug,
          tier: 'free',
          is_active: true
        })
        .select()
        .single();

      if (newCompErr) {
        console.error(`Failed to create company ${slug}:`, newCompErr.message);
        continue;
      }
      companyId = newComp.id;
      companyMap.set(slug, companyId);
    }

    // Now read CSV files for this company
    const compDir = path.join(DATA_DIR, slug);
    // Prefer thirty-days, if not found, six-months, if not found, all.csv
    const filesToTry = ['thirty-days.csv', 'three-months.csv', 'six-months.csv', 'all.csv'];
    let chosenFile = null;
    for (const f of filesToTry) {
        if (fs.existsSync(path.join(compDir, f))) {
            chosenFile = f;
            break;
        }
    }

    if (!chosenFile) {
      continue;
    }

    const csvPath = path.join(compDir, chosenFile);
    const rows = await parseCSV(csvPath);

    // Filter valid rows and map to DB schema
    const newQuestions = [];
    for (const row of rows) {
      if (!row.Title || !row.URL) continue;

      // Extract frequency number from percentage (e.g. "100.0%" -> 100)
      let freq = 1;
      if (row['Frequency %']) {
        freq = parseInt(row['Frequency %'].replace('%', ''), 10);
        if (isNaN(freq)) freq = 1;
      }

      const q = {
        company_id: companyId,
        round: 'Technical 1',
        question: row.Title,
        difficulty: row.Difficulty || 'Medium',
        frequency: freq,
        year_reported: 2026,
        source_url: row.URL,
        is_approved: true
      };

      if (hasAcceptanceCol && row['Acceptance %']) {
        q.acceptance_rate = row['Acceptance %'];
      }

      newQuestions.push(q);
    }

    if (newQuestions.length > 0) {
      // Avoid inserting duplicate questions per company based on source_url.
      // Easiest is to fetch existing URLs for this company.
      const { data: existingQs } = await supabase
        .from('questions')
        .select('source_url')
        .eq('company_id', companyId)
        .not('source_url', 'is', null);
      
      const existingUrls = new Set(existingQs?.map(q => q.source_url) || []);
      const qsToInsert = newQuestions.filter(q => !existingUrls.has(q.source_url));

      if (qsToInsert.length > 0) {
        // Create chunks of 100 to insert
        const chunkSize = 100;
        for (let i = 0; i < qsToInsert.length; i += chunkSize) {
          const chunk = qsToInsert.slice(i, i + chunkSize);
          const { error: insertErr } = await supabase.from('questions').insert(chunk);
          if (insertErr) {
            console.error(`Failed to insert questions for ${slug}:`, insertErr.message);
          } else {
            totalQuestionsInserted += chunk.length;
          }
        }
        console.log(`Inserted ${qsToInsert.length} questions for ${slug}`);
      }
    }
  }

  console.log(`\nJob complete! Inserted ${totalQuestionsInserted} total questions.`);
}

main().catch(console.error);
