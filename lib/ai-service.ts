import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

// Current Groq models as of 2026
const MODELS = {
    // Latest Llama models
    LLAMA_3_3_70B: 'llama-3.3-70b-versatile',  // New version
    LLAMA_3_1_8B: 'llama-3.1-8b-instant',
    LLAMA_3_2_3B: 'llama-3.2-3b-preview',
    LLAMA_3_2_1B: 'llama-3.2-1b-preview',

    // Mixtral models (Decommissioned, falling back to Llama)
    MIXTRAL_8x7B: 'llama-3.1-8b-instant',

    // Gemma models (Decommissioned, falling back to Llama)
    GEMMA_2_9B: 'llama-3.1-8b-instant',
    GEMMA_2_27B: 'gemma-2-27b-it',

    // New models (Decommissioned, falling back to Llama)
    QWEN_2_5_32B: 'llama-3.1-8b-instant',
    DEEPSEEK_R1: 'deepseek-r1-distill-qwen-32b',
    WHISPER: 'whisper-large-v3-turbo'
};

export async function generateWithGroq(
    prompt: string,
    systemPrompt: string = 'You are a helpful AI assistant.',
    model: string = MODELS.LLAMA_3_3_70B,  // Updated default
    temperature: number = 0.7
) {
    try {
        console.log(`Using Groq model: ${model}`);

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: model,
            temperature: temperature,
            max_tokens: 4000,
            top_p: 0.95
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
        console.error('Groq API error:', error);

        // If model fails, try fallback
        if (error.status === 400 && error.error?.code === 'model_decommissioned') {
            console.log('Model decommissioned, trying fallback...');
            return generateWithGroq(prompt, systemPrompt, MODELS.MIXTRAL_8x7B, temperature);
        }

        throw error;
    }
}

// Specialized functions with fallback models
export async function generateRoadmap(company: string, role: string, experience: string, duration: string) {
    const prompt = `Create a detailed ${duration}-week interview preparation roadmap for ${company} for a ${role} position.
  
  Experience level: ${experience}
  
  Include:
  1. Weekly breakdown of topics to study
  2. Key LeetCode problems to practice each week
  3. System design concepts to cover
  4. Behavioral preparation tips
  5. Resources and practice strategies
  
  Format the response in markdown with clear sections.`;

    const systemPrompt = 'You are an expert interview coach specializing in tech placements.';

    try {
        // Try latest Llama first
        return await generateWithGroq(prompt, systemPrompt, MODELS.LLAMA_3_3_70B);
    } catch (error) {
        console.log('Primary model failed, trying Mixtral...');
        // Fallback to Mixtral
        return await generateWithGroq(prompt, systemPrompt, MODELS.MIXTRAL_8x7B);
    }
}

export async function explainProblem(problem: string, difficulty: string) {
    const prompt = `Explain this ${difficulty} LeetCode problem: ${problem}
  
  Provide:
  1. Problem understanding
  2. Approach
  3. Complexity analysis
  4. Example walkthrough`;

    const systemPrompt = 'You are a LeetCode expert tutor. Provide clear explanations with examples.';

    try {
        return await generateWithGroq(prompt, systemPrompt, MODELS.GEMMA_2_9B, 0.5);
    } catch (error) {
        return await generateWithGroq(prompt, systemPrompt, MODELS.MIXTRAL_8x7B, 0.5);
    }
}

export async function generateHint(problem: string) {
    const prompt = `Give a subtle hint for this problem without revealing the full solution: ${problem}`;
    const systemPrompt = 'You are a helpful coding tutor. Provide hints that guide but don\'t give away the answer.';

    return generateWithGroq(prompt, systemPrompt, MODELS.LLAMA_3_2_3B, 0.3); // Smaller model for hints
}

export async function debugCode(code: string, language: string, userId: string = 'anonymous') {
    const prompt = `Debug this ${language} code and suggest fixes:\n\n${code}`;
    const systemPrompt = 'You are a debugging expert. Identify issues and explain how to fix them.';

    return generateWithGroq(prompt, systemPrompt, MODELS.MIXTRAL_8x7B);
}

export async function analyzeResume(resumeText: string) {
    const prompt = `Analyze this resume for SDE roles at top tech companies. Respond ONLY with this exact JSON format:
{
  "score": <integer 0-100, ATS and quality score>,
  "summary": "<2-3 sentence overall assessment, be honest>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "improvements": ["<specific actionable improvement>", "<specific actionable improvement>", "<specific actionable improvement>", "<specific actionable improvement>"],
  "missing_keywords": ["<missing tech keyword>", "<missing tech keyword>", "..."]
}

Resume text:
${resumeText}`;

    const systemPrompt = `You are an expert ATS resume reviewer and technical recruiter for top tech companies in India. 
          Analyze resumes for Software Development Engineer (SDE) roles. Be specific, actionable, and honest.
          Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

    return generateWithGroq(prompt, systemPrompt, MODELS.LLAMA_3_3_70B, 0.3);
}

export async function getAIResponse(prompt: string, userId: string = 'anonymous', systemPrompt: string = "You're a LeetCode expert.") {
    return generateWithGroq(prompt, systemPrompt, MODELS.LLAMA_3_3_70B);
}

export async function generateSolutionApproach(problem: string, userId: string = 'anonymous') {
    const prompt = `Generate a detailed step-by-step solution approach for this LeetCode problem: ${problem}`;
    const systemPrompt = 'You are a LeetCode expert. Provide a conceptual algorithmic approach without writing the exact code out entirely.';
    return generateWithGroq(prompt, systemPrompt, MODELS.LLAMA_3_3_70B);
}

export async function getHint(problem: string, userId: string = 'anonymous') {
    return generateHint(problem);
}

// Export models for use elsewhere
export { MODELS };
