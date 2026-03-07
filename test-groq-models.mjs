import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const modelsToTest = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
    'qwen-2.5-32b'
];

async function testModels() {
    for (const model of modelsToTest) {
        try {
            console.log(`Testing ${model}...`);
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: 'Say "Hello" in one word' }],
                model: model,
                max_tokens: 10
            });
            console.log(`✅ ${model} works:`, completion.choices[0].message.content);
        } catch (error) {
            console.log(`❌ ${model} failed:`, error.message);
        }
        console.log('---');
    }
}

testModels();
