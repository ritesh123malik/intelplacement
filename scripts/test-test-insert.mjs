import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing Supabase connection...');

    // Get a company ID
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);

    if (compError) {
        console.error('Failed to fetch companies:', compError);
        return;
    }

    if (!companies || companies.length === 0) {
        console.log('No companies found');
        return;
    }

    const company = companies[0];
    console.log('Testing with company:', company);

    // Try to insert a test
    console.log('Attempting to insert test record...');
    const { data, error } = await supabase
        .from('tests')
        .insert({
            company_id: company.id,
            title: `${company.name} Test`,
            description: 'Test description',
            duration_minutes: 45,
            difficulty: 'mixed',
            question_count: 3
        })
        .select();

    if (error) {
        console.error('Insert failed! RLS policy or schema issue detected:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
    } else {
        console.log('Insert succeeded bypassing RLS:', data);
    }
}

testInsert();
