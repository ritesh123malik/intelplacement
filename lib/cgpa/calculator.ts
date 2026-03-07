import { supabase } from '@/lib/supabase';

export interface Grade {
    courseId: string;
    courseName: string;
    courseCode: string;
    credits: number;
    gradePoint: number;
    semester: number;
    courseType: string;
    isBacklog?: boolean;
}

export interface SemesterResult {
    semester: number;
    sgpa: number;
    totalCredits: number;
    earnedCredits: number;
    grades: Grade[];
    backlogCount?: number;
}

export interface CGPAResult {
    currentCGPA: number;
    totalCredits: number;
    earnedCredits: number;
    totalBacklogs: number;
    semesterResults: SemesterResult[];
    targetAnalysis?: TargetAnalysis;
}

export interface TargetAnalysis {
    targetCGPA: number;
    currentCGPA: number;
    remainingSemesters: number;
    remainingCredits: number;
    requiredAverageSGPA: number;
    isPossible: boolean;
    semesterWiseBreakdown: {
        semester: number;
        requiredSGPA: number;
        credits: number;
        currentStatus: 'completed' | 'upcoming';
    }[];
    gradeSuggestions: {
        semester: number;
        suggestedGrades: { [key: string]: number };
    }[];
}

export interface GradePointMap {
    [key: string]: number;
}

// Helper: converts any Supabase/unknown error into a real Error object
function toError(err: unknown): Error {
    if (err instanceof Error) return err;

    // Supabase returns plain objects with non-enumerable props — extract manually
    if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        const message =
            (typeof e['message'] === 'string' ? e['message'] : null) ||
            (typeof e['msg'] === 'string' ? e['msg'] : null) ||
            JSON.stringify(err);
        const enhanced = new Error(message);
        // Copy all known Supabase error fields explicitly
        (enhanced as any).code = e['code'] ?? undefined;
        (enhanced as any).details = e['details'] ?? undefined;
        (enhanced as any).hint = e['hint'] ?? undefined;
        (enhanced as any).status = e['status'] ?? undefined;
        return enhanced;
    }

    if (typeof err === 'string') return new Error(err);
    return new Error('Unknown error');
}

class LNMIITCGPACalculator {
    private gradePoints: GradePointMap = {
        'A+': 10,
        'A': 9,
        'B+': 8,
        'B': 7,
        'C+': 6,
        'C': 5,
        'D': 4,
        'F': 0
    };

    // Calculate SGPA for a semester
    calculateSGPA(grades: Grade[]): number {
        let totalPoints = 0;
        let totalCredits = 0;

        for (const grade of grades) {
            if (!grade.isBacklog || (grade.isBacklog && grade.gradePoint > 0)) {
                totalPoints += grade.credits * grade.gradePoint;
                totalCredits += grade.credits;
            }
        }

        return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
    }

    // Calculate CGPA from all semesters
    calculateCGPA(semesterResults: SemesterResult[]): CGPAResult {
        let totalPoints = 0;
        let totalCredits = 0;
        let earnedCredits = 0;
        let totalBacklogs = 0;

        const processedResults = semesterResults.map(sem => {
            const sgpa = this.calculateSGPA(sem.grades);
            const semesterCredits = sem.grades.reduce((sum, g) => sum + g.credits, 0);
            const semesterEarned = sem.grades.reduce((sum, g) =>
                g.gradePoint > 0 ? sum + g.credits : sum, 0
            );
            const backlogCount = sem.grades.filter(g => g.gradePoint === 0).length;

            totalPoints += sgpa * semesterEarned;
            totalCredits += semesterCredits;
            earnedCredits += semesterEarned;
            totalBacklogs += backlogCount;

            return {
                ...sem,
                sgpa,
                totalCredits: semesterCredits,
                earnedCredits: semesterEarned,
                backlogCount
            };
        });

        const currentCGPA = earnedCredits > 0 ? Number((totalPoints / earnedCredits).toFixed(2)) : 0;

        return {
            currentCGPA,
            totalCredits,
            earnedCredits,
            totalBacklogs,
            semesterResults: processedResults
        };
    }

    // Predict required grades to achieve target CGPA
    predictTarget(
        completedSemesters: SemesterResult[],
        targetCGPA: number,
        upcomingSemesters: { semester: number; credits: number }[]
    ): TargetAnalysis {
        let currentPoints = 0;
        let currentCredits = 0;

        for (const sem of completedSemesters) {
            const sgpa = this.calculateSGPA(sem.grades);
            const semEarnedCredits = sem.grades.reduce((sum, g) =>
                g.gradePoint > 0 ? sum + g.credits : sum, 0
            );
            currentPoints += sgpa * semEarnedCredits;
            currentCredits += semEarnedCredits;
        }

        const upcomingCredits = upcomingSemesters.reduce((sum, sem) => sum + sem.credits, 0);
        const totalCredits = currentCredits + upcomingCredits;

        const requiredTotalPoints = targetCGPA * totalCredits;
        const requiredRemainingPoints = requiredTotalPoints - currentPoints;
        const requiredAvgSGPA = requiredRemainingPoints / upcomingCredits;

        const isPossible = requiredAvgSGPA <= 10 && requiredAvgSGPA >= 0;

        const semesterWiseBreakdown = [
            ...completedSemesters.map(sem => ({
                semester: sem.semester,
                requiredSGPA: sem.sgpa,
                credits: sem.earnedCredits,
                currentStatus: 'completed' as const
            })),
            ...upcomingSemesters.map(sem => ({
                semester: sem.semester,
                requiredSGPA: Number(requiredAvgSGPA.toFixed(2)),
                credits: sem.credits,
                currentStatus: 'upcoming' as const
            }))
        ];

        const gradeSuggestions = upcomingSemesters.map(sem => {
            const suggestedGrades: { [key: string]: number } = {};

            if (requiredAvgSGPA >= 9) {
                suggestedGrades['Minimum Grade'] = 9;
                suggestedGrades['Target'] = 10;
                suggestedGrades['Required Points'] = requiredAvgSGPA;
            } else if (requiredAvgSGPA >= 8) {
                suggestedGrades['Minimum Grade'] = 8;
                suggestedGrades['Target'] = 9;
                suggestedGrades['Required Points'] = requiredAvgSGPA;
            } else if (requiredAvgSGPA >= 7) {
                suggestedGrades['Minimum Grade'] = 7;
                suggestedGrades['Target'] = 8;
                suggestedGrades['Required Points'] = requiredAvgSGPA;
            } else if (requiredAvgSGPA >= 6) {
                suggestedGrades['Minimum Grade'] = 6;
                suggestedGrades['Target'] = 7;
                suggestedGrades['Required Points'] = requiredAvgSGPA;
            } else {
                suggestedGrades['Minimum Grade'] = 5;
                suggestedGrades['Target'] = 6;
                suggestedGrades['Required Points'] = requiredAvgSGPA;
            }

            return {
                semester: sem.semester,
                suggestedGrades
            };
        });

        return {
            targetCGPA,
            currentCGPA: currentCredits > 0 ? Number((currentPoints / currentCredits).toFixed(2)) : 0,
            remainingSemesters: upcomingSemesters.length,
            remainingCredits: upcomingCredits,
            requiredAverageSGPA: Number(requiredAvgSGPA.toFixed(2)),
            isPossible,
            semesterWiseBreakdown,
            gradeSuggestions
        };
    }

    // Convert letter grade to grade point
    getGradePoint(grade: string): number {
        return this.gradePoints[grade] || 0;
    }

    // Get grade from percentage
    getGradeFromPercentage(percentage: number): { grade: string; points: number } {
        if (percentage >= 90) return { grade: 'A+', points: 10 };
        if (percentage >= 80) return { grade: 'A', points: 9 };
        if (percentage >= 70) return { grade: 'B+', points: 8 };
        if (percentage >= 60) return { grade: 'B', points: 7 };
        if (percentage >= 55) return { grade: 'C+', points: 6 };
        if (percentage >= 50) return { grade: 'C', points: 5 };
        if (percentage >= 45) return { grade: 'D', points: 4 };
        return { grade: 'F', points: 0 };
    }

    // Save user grades to database
    async saveUserGrades(userId: string, grades: Grade[]) {
        try {
            const { error } = await supabase
                .from('user_grades')
                .upsert(
                    grades.map(g => ({
                        user_id: userId,
                        course_id: g.courseId,
                        semester_number: g.semester,
                        grade_point: g.gradePoint,
                        is_backlog: g.isBacklog || false
                    })),
                    { onConflict: 'user_id, course_id' }
                );

            if (error) throw toError(error);

            // Calculate and save semester results
            const semesterMap = new Map<number, Grade[]>();
            grades.forEach(g => {
                if (!semesterMap.has(g.semester)) {
                    semesterMap.set(g.semester, []);
                }
                semesterMap.get(g.semester)!.push(g);
            });

            for (const [semester, semGrades] of semesterMap) {
                const sgpa = this.calculateSGPA(semGrades);
                const earnedCredits = semGrades.reduce((sum, g) =>
                    g.gradePoint > 0 ? sum + g.credits : sum, 0
                );

                const { error: semError } = await supabase
                    .from('user_semester_results')
                    .upsert({
                        user_id: userId,
                        semester_number: semester,
                        sgpa,
                        total_credits: semGrades.reduce((sum, g) => sum + g.credits, 0),
                        earned_credits: earnedCredits
                    }, { onConflict: 'user_id, semester_number' });

                // FIX: semError was a raw Supabase object — convert before throwing
                if (semError) throw toError(semError);
            }
        } catch (error: unknown) {
            const err = toError(error);
            console.error('Save error details:', {
                message: err.message,
                code: (err as any).code,
                details: (err as any).details,
                hint: (err as any).hint,
            });
            throw err;
        }
    }

    // Load user grades from database
    async loadUserGrades(userId: string): Promise<Grade[]> {
        const { data, error } = await supabase
            .from('user_grades')
            .select(`
        *,
        courses (
          course_code,
          course_name,
          credits,
          course_type
        )
      `)
            .eq('user_id', userId)
            .order('semester_number');

        if (error) throw toError(error);

        return data.map((g: any) => ({
            courseId: g.course_id,
            courseName: g.courses.course_name,
            courseCode: g.courses.course_code,
            credits: g.courses.credits,
            gradePoint: g.grade_point,
            semester: g.semester_number,
            courseType: g.courses.course_type,
            isBacklog: g.is_backlog
        }));
    }

    // Get upcoming semesters with their credits
    async getUpcomingSemesters(branchCode: string, completedSemesters: number): Promise<{ semester: number; credits: number }[]> {
        const { data: branch } = await supabase
            .from('branches')
            .select('id')
            .eq('code', branchCode)
            .single();

        if (!branch) return [];

        const { data: semesters } = await supabase
            .from('semesters')
            .select('semester_number, total_credits')
            .eq('branch_id', branch.id)
            .gte('semester_number', completedSemesters + 1)
            .lte('semester_number', 8)
            .order('semester_number');

        return (semesters || []).map(s => ({
            semester: s.semester_number,
            credits: s.total_credits
        }));
    }

    // Set CGPA target
    async setTarget(userId: string, targetCGPA: number, currentCGPA: number, completedSemesters: number) {
        const { error } = await supabase
            .from('cgpa_targets')
            .upsert({
                user_id: userId,
                target_cgpa: targetCGPA,
                current_cgpa: currentCGPA,
                completed_semesters: completedSemesters,
                total_semesters: 8
            });

        if (error) throw toError(error);
    }

    // Get user's target
    async getTarget(userId: string) {
        const { data, error } = await supabase
            .from('cgpa_targets')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error && (error as any).code !== 'PGRST116') throw toError(error);
        return data;
    }
}

export const cgpaCalculator = new LNMIITCGPACalculator();
