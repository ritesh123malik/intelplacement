// lib/tests/generator.ts
import { supabase } from '@/lib/supabase';

export interface TestQuestion {
    id: string;
    title: string;
    difficulty: string;
    leetcode_url: string;
    order: number;
    points: number;
    time_estimate: number;
}

export interface GeneratedTest {
    id: string;
    title: string;
    company: string;
    duration: number;
    questions: TestQuestion[];
}

class TestGenerator {
    async generateCompanyTest(
        companyId: string,
        companyName: string,
        duration: number = 45,
        difficulty: string = 'mixed'
    ): Promise<GeneratedTest | null> {
        try {
            // Fetch questions for this company
            let query = supabase
                .from('questions')
                .select('id, question, difficulty, source_url, frequency')
                .eq('company_id', companyId)
                .eq('is_approved', true);

            if (difficulty !== 'mixed') {
                query = query.eq('difficulty', difficulty);
            }

            const { data: questions, error } = await query
                .order('frequency', { ascending: false })
                .limit(20);

            console.log('Questions query result:', {
                companyId,
                questionCount: questions?.length,
                error: error?.message
            });

            if (error) {
                console.error('Supabase error details:', error);
                return null;
            }

            if (!questions || questions.length === 0) {
                console.log(`No questions found for company ID: ${companyId}`);

                // Check if company exists
                const { data: company } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', companyId)
                    .single();

                console.log('Company exists:', company);

                return null;
            }

            const questionCount = Math.min(Math.floor(duration / 15), questions.length);
            const selectedQuestions = questions.slice(0, questionCount);

            // Create test in database
            console.log('Attempting to insert test with data:', {
                company_id: companyId,
                title: `${companyName} ${duration}-Minute Assessment`,
                description: `Practice with real questions asked in ${companyName} interviews`,
                duration_minutes: duration,
                difficulty: difficulty,
                question_count: selectedQuestions.length
            });

            const { data: test, error: testError } = await supabase
                .from('tests')
                .insert({
                    company_id: companyId,
                    title: `${companyName} ${duration}-Minute Assessment`,
                    description: `Practice with real questions asked in ${companyName} interviews`,
                    duration_minutes: duration,
                    difficulty: difficulty,
                    question_count: selectedQuestions.length
                })
                .select()
                .single();

            if (testError) {
                console.error('Test creation error details:', {
                    message: testError.message,
                    details: testError.details,
                    hint: testError.hint,
                    code: testError.code
                });

                // Fallback for development if insert fails (likely RLS)
                if (process.env.NODE_ENV === 'development') {
                    console.log('Development mode: returning mock test due to DB insert failure');
                    return this.createMockTestLocal(companyName, duration, selectedQuestions);
                }

                return null;
            }

            if (!test) {
                console.error('Test creation returned no data');
                return null;
            }

            console.log('Test created successfully:', test.id);

            // Add questions to test
            const testQuestions = selectedQuestions.map((q, index) => ({
                test_id: test.id,
                question_id: q.id,
                question_order: index + 1,
                points: this.calculatePoints(q.difficulty)
            }));

            const { error: linkError } = await supabase
                .from('test_questions')
                .insert(testQuestions);

            if (linkError) {
                console.error('Error linking questions:', linkError);
                return null;
            }

            return {
                id: test.id,
                title: test.title,
                company: companyName,
                duration: test.duration_minutes,
                questions: selectedQuestions.map((q, index) => ({
                    id: q.id,
                    title: q.question,
                    difficulty: q.difficulty,
                    leetcode_url: q.source_url || this.generateLeetCodeUrl(q.question),
                    order: index + 1,
                    points: this.calculatePoints(q.difficulty),
                    time_estimate: this.getTimeEstimate(q.difficulty)
                }))
            };
        } catch (error) {
            console.error('Test generation error:', error);
            return null;
        }
    }

    private createMockTestLocal(companyName: string, duration: number, selectedQuestions: any[]): GeneratedTest {
        return {
            id: `mock-test-${Date.now()}`,
            title: `${companyName} ${duration}-Minute Assessment (Mock)`,
            company: companyName,
            duration: duration,
            questions: selectedQuestions.map((q, index) => ({
                id: q.id,
                title: q.question,
                difficulty: q.difficulty,
                leetcode_url: q.source_url || this.generateLeetCodeUrl(q.question),
                order: index + 1,
                points: this.calculatePoints(q.difficulty),
                time_estimate: this.getTimeEstimate(q.difficulty)
            }))
        };
    }

    private calculatePoints(difficulty: string): number {
        switch (difficulty) {
            case 'Easy': return 10;
            case 'Medium': return 20;
            case 'Hard': return 30;
            default: return 15;
        }
    }

    private getTimeEstimate(difficulty: string): number {
        switch (difficulty) {
            case 'Easy': return 10;
            case 'Medium': return 15;
            case 'Hard': return 20;
            default: return 15;
        }
    }

    private generateLeetCodeUrl(questionTitle: string): string {
        const slug = questionTitle
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        return `https://leetcode.com/problems/${slug}/`;
    }
}

export const testGenerator = new TestGenerator();
