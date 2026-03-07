const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    console.log('Testing connection...');
    const { data, error } = await supabase
        .from('user_grades')
        .select('count')
        .limit(1);

    if (error) {
        console.error('Connection failed:', {
            message: error.message,
            code: error.code,
            details: error.details
        });
    } else {
        console.log('Connection successful!');
    }
}

test();
