import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
    const tables = [
        'spaced_repetition_settings',
        'spaced_repetition_cards',
        'spaced_repetition_reviews',
        'user_streaks'
    ];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });

            console.log(`${table}: ${error ? '❌' : '✅'}`, error?.message || 'OK');
        } catch (err) {
            console.log(`${table}: ❌ Error -`, err.message);
        }
    }

    // Check RLS policies
    console.log('\nChecking RLS policies...');
    const { data: policies, error } = await supabase.rpc('get_policies', {});
    if (policies) {
        console.log('Policies exist');
    } else {
        console.log('Could not check policies directly');
    }
}

checkTables();
