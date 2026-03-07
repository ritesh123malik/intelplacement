'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cgpaCalculator, Grade, SemesterResult, TargetAnalysis, CGPAResult } from '@/lib/cgpa/calculator';
import {
    CalculatorIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
    FireIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';

const buttonStyles = {
    primary: {
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: 'white',
        fontWeight: '600',
        fontSize: '1.125rem',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        border: 'none',
        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s ease'
    },
    secondary: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        fontWeight: '600',
        fontSize: '1rem',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.75rem',
        border: 'none',
        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    }
};

// Helper: safely extract a readable message from any thrown value
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e['message'] === 'string') return e['message'];
    }
    if (typeof err === 'string') return err;
    return 'An unexpected error occurred';
}

// Helper: build a loggable plain object from any error (works around non-enumerable Supabase props)
function serializeError(err: unknown): Record<string, unknown> {
    if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        return {
            message: e['message'] ?? '(none)',
            code: e['code'] ?? undefined,
            details: e['details'] ?? undefined,
            hint: e['hint'] ?? undefined,
            status: e['status'] ?? undefined,
            stack: e['stack'] ?? undefined,
        };
    }
    if (typeof err === 'string') return { message: err };
    return { message: 'Unknown error', raw: String(err) };
}

export default function CGPACalculatorPage() {
    const [selectedBranch, setSelectedBranch] = useState<string>('CSE');
    const [grades, setGrades] = useState<Grade[]>([]);
    const [cgpaResult, setCgpaResult] = useState<CGPAResult | null>(null);
    const [targetCGPA, setTargetCGPA] = useState<string>('');
    const [targetAnalysis, setTargetAnalysis] = useState<TargetAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'calculator' | 'predictor' | 'history'>('calculator');
    const [branchCourses, setBranchCourses] = useState<Map<number, any>>(new Map());
    const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set([1]));
    const [showSuccess, setShowSuccess] = useState(false);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [debugMode, setDebugMode] = useState(false);

    const branches = [
        { id: 'CSE', name: 'Computer Science', icon: '💻', color: 'blue', students: 'Core CS, Algorithms, Software Dev' },
        { id: 'ECE', name: 'Electronics & Comm.', icon: '📡', color: 'purple', students: 'VLSI, Embedded, Communication' },
        { id: 'CCE', name: 'Comm. & Computer Engg.', icon: '📱', color: 'green', students: 'IoT, Networking, Systems' },
        { id: 'ME', name: 'Mechanical Engg.', icon: '⚙️', color: 'orange', students: 'Thermal, Design, Manufacturing' }
    ];

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            loadBranchCourses();
        }
    }, [selectedBranch]);

    const loadUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUserName(profile.full_name || 'Student');
        }

        try {
            const userGrades = await cgpaCalculator.loadUserGrades(user.id);
            if (userGrades.length > 0) {
                setGrades(userGrades);

                const semesterMap = new Map<number, Grade[]>();
                userGrades.forEach(g => {
                    if (!semesterMap.has(g.semester)) {
                        semesterMap.set(g.semester, []);
                    }
                    semesterMap.get(g.semester)!.push(g);
                });

                const semesterResults: SemesterResult[] = [];
                for (let sem = 1; sem <= 8; sem++) {
                    const semGrades = semesterMap.get(sem) || [];
                    semesterResults.push({
                        semester: sem,
                        sgpa: 0,
                        totalCredits: semGrades.reduce((sum, g) => sum + g.credits, 0),
                        earnedCredits: semGrades.reduce((sum, g) => g.gradePoint > 0 ? sum + g.credits : sum, 0),
                        grades: semGrades
                    });
                }

                const result = cgpaCalculator.calculateCGPA(semesterResults);
                setCgpaResult(result);
            }
        } catch (err: unknown) {
            console.error('Error loading grades:', serializeError(err));
        }
    };

    const loadBranchCourses = async () => {
        const { data: branchData } = await supabase
            .from('branches')
            .select('id')
            .eq('code', selectedBranch)
            .single();

        if (!branchData) return;

        const { data: semesters } = await supabase
            .from('semesters')
            .select(`
        semester_number,
        total_credits,
        courses (
          id,
          course_code,
          course_name,
          credits,
          course_type,
          lecture_hours,
          tutorial_hours,
          practical_hours,
          is_lab
        )
      `)
            .eq('branch_id', branchData.id)
            .order('semester_number');

        const courseMap = new Map();
        semesters?.forEach((sem: any) => {
            courseMap.set(sem.semester_number, {
                courses: sem.courses,
                totalCredits: sem.total_credits
            });
        });
        setBranchCourses(courseMap);
    };

    const handleGradeChange = (courseId: string, gradePoint: number, semester: number) => {
        setGrades(prev => {
            const existing = prev.findIndex(g => g.courseId === courseId);
            const semesterData = branchCourses.get(semester);
            const course = semesterData?.courses.find((c: any) => c.id === courseId);

            if (!course) return prev;

            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = {
                    ...updated[existing],
                    gradePoint
                };
                return updated;
            } else {
                return [...prev, {
                    courseId,
                    courseName: course.course_name,
                    courseCode: course.course_code,
                    credits: course.credits,
                    gradePoint,
                    semester,
                    courseType: course.course_type,
                    isBacklog: gradePoint === 0
                }];
            }
        });
    };

    const calculateResults = async () => {
        setLoading(true);
        setError('');

        try {
            const semesterMap = new Map<number, Grade[]>();
            grades.forEach(g => {
                if (!semesterMap.has(g.semester)) {
                    semesterMap.set(g.semester, []);
                }
                semesterMap.get(g.semester)!.push(g);
            });

            const semesterResults: SemesterResult[] = [];
            for (let sem = 1; sem <= 8; sem++) {
                const semGrades = semesterMap.get(sem) || [];
                semesterResults.push({
                    semester: sem,
                    sgpa: 0,
                    totalCredits: semGrades.reduce((sum, g) => sum + g.credits, 0),
                    earnedCredits: semGrades.reduce((sum, g) => g.gradePoint > 0 ? sum + g.credits : sum, 0),
                    grades: semGrades
                });
            }

            const result = cgpaCalculator.calculateCGPA(semesterResults);
            setCgpaResult(result);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setSaving(true);
                try {
                    await cgpaCalculator.saveUserGrades(user.id, grades);
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                } catch (saveErr: unknown) {
                    // FIX: use serializeError — Supabase errors have non-enumerable props
                    // that cause plain object spread { message, code } to log as {}
                    console.error('Error saving grades:', serializeError(saveErr));
                    setError(`Failed to save: ${getErrorMessage(saveErr)}`);
                } finally {
                    setSaving(false);
                }
            }
        } catch (err: unknown) {
            console.error('Error in calculateResults:', serializeError(err));
            setError('Failed to calculate CGPA. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const analyzeTarget = async () => {
        if (!cgpaResult || !targetCGPA) {
            alert('Please calculate your CGPA first and enter a target');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please login to use the predictor');
            return;
        }

        try {
            console.log('Analyzing target:', {
                targetCGPA: parseFloat(targetCGPA),
                currentCGPA: cgpaResult.currentCGPA
            });

            const completedSemesters = cgpaResult.semesterResults
                .filter(s => s.grades.length > 0)
                .map(s => ({
                    semester: s.semester,
                    sgpa: s.sgpa,
                    credits: s.earnedCredits,
                    totalCredits: s.totalCredits,
                    earnedCredits: s.earnedCredits,
                    grades: s.grades
                }));

            const upcomingSemesters = await cgpaCalculator.getUpcomingSemesters(
                selectedBranch,
                completedSemesters.length
            );

            const analysis = cgpaCalculator.predictTarget(
                completedSemesters,
                parseFloat(targetCGPA),
                upcomingSemesters
            );

            setTargetAnalysis(analysis);

            try {
                await cgpaCalculator.setTarget(
                    user.id,
                    parseFloat(targetCGPA),
                    analysis.currentCGPA,
                    completedSemesters.length
                );
            } catch (saveErr: unknown) {
                // FIX: use serializeError instead of spreading object literal with named keys
                console.error('Error saving target:', serializeError(saveErr));
                // Non-critical — target display already set, so we don't block the user
            }

        } catch (err: unknown) {
            console.error('Error in analyzeTarget:', serializeError(err));
            alert(`Error analyzing target: ${getErrorMessage(err)}`);
        }
    };

    const toggleSemester = (semester: number) => {
        setExpandedSemesters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(semester)) {
                newSet.delete(semester);
            } else {
                newSet.add(semester);
            }
            return newSet;
        });
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 9) return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (grade >= 8) return 'text-blue bg-blue/10 border-blue/20';
        if (grade >= 7) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        if (grade >= 6) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        if (grade >= 5) return 'text-red-400 bg-red-400/10 border-red-400/20';
        return 'text-text-muted bg-surface border-border';
    };

    const getCGPAStatusColor = (cgpa: number) => {
        if (cgpa >= 9) return 'text-green-500 glow-green';
        if (cgpa >= 8) return 'text-blue glow-blue';
        if (cgpa >= 7) return 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]';
        if (cgpa >= 6) return 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]';
        return 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    };

    const calculateProgress = () => {
        if (!cgpaResult) return 0;
        const completed = cgpaResult.semesterResults.filter(s => s.grades.length > 0).length;
        return (completed / 8) * 100;
    };

    return (
        <div className="min-h-screen bg-bg noise">
            {/* Header */}
            <div className="pt-24 pb-8 border-b border-border bg-gradient-to-b from-blue/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-display font-bold mb-2 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-blue to-purple-500">
                                <CalculatorIcon className="w-10 h-10 mr-3 text-blue" />
                                CGPA Calculator
                            </h1>
                            <p className="text-text-secondary text-lg">
                                Calculate your SGPA, track your CGPA, and mathematically predict grade targets.
                            </p>
                        </div>
                        {userName && (
                            <div className="card border-border-strong px-6 py-4 rounded-2xl flex items-center gap-4 bg-surface/50 backdrop-blur-sm">
                                <div className="w-12 h-12 rounded-full bg-blue-dim border border-blue/30 flex items-center justify-center">
                                    <span className="text-blue text-lg font-display font-bold uppercase">{userName.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Welcome back</p>
                                    <p className="text-lg font-bold text-text-primary">{userName}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-8 right-8 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 flex items-center gap-3 backdrop-blur-md"
                    >
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-medium">Academic records synced securely.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Branch Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {branches.length === 0 ? (
                        <div className="col-span-full card p-12 text-center flex flex-col items-center justify-center">
                            <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mb-4" />
                            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Course Data Not Available</h3>
                            <p className="text-text-secondary max-w-lg mx-auto">
                                The curriculum data required to calculate grades is currently syncing or unavailable. Please check back later when your institution's course map is loaded.
                            </p>
                        </div>
                    ) : (
                        branches.map((branch) => (
                            <motion.button
                                key={branch.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedBranch(branch.id)}
                                className={`p-5 rounded-2xl transition-all border text-left flex flex-col h-full ${selectedBranch === branch.id
                                    ? `bg-primary-50 border-primary-500 text-primary-700 shadow-glow`
                                    : 'bg-surface hover:bg-surface-dark border-border hover:border-border-strong text-text-secondary'
                                    }`}
                            >
                                <div className="text-3xl mb-3">{branch.icon}</div>
                                <div className="font-display font-bold text-lg mb-1">{branch.name}</div>
                                <div className="text-xs opacity-75 mt-auto leading-relaxed">{branch.students}</div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Progress Overview */}
                {cgpaResult && (
                    <div className="card p-8 rounded-3xl border-border-strong mb-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue/5 rounded-full blur-3xl group-hover:bg-blue/10 transition-colors duration-700 pointer-events-none -mr-20 -mt-20"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="text-2xl font-display font-bold text-text-primary">Academic Run</h2>
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center">
                                    <FireIcon className="w-5 h-5 text-orange-500 mr-2" />
                                    <span className="font-medium text-text-secondary">{cgpaResult.totalBacklogs} Active Backlogs</span>
                                </div>
                                <div className="flex items-center bg-surface px-4 py-2 rounded-xl border border-border">
                                    <TrophyIcon className="w-5 h-5 text-gold mr-2" />
                                    <span className="font-mono font-bold text-text-primary tracking-tight">
                                        {cgpaResult.earnedCredits}<span className="text-text-muted font-normal">/{cgpaResult.totalCredits}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-surface-dark border border-border-strong rounded-full h-3 mb-3 shadow-inner relative z-10">
                            <div
                                className="bg-gradient-to-r from-blue to-purple-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)] relative overflow-hidden"
                                style={{ width: `${calculateProgress()}%` }}
                            >
                                <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-text-muted uppercase tracking-wider relative z-10">
                            <span>Start</span>
                            <span>Midpoint</span>
                            <span>Graduation</span>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-2 mb-8 bg-surface border border-border p-1.5 rounded-2xl w-fit">
                    {[
                        { id: 'calculator', name: 'CGPA Engine', icon: CalculatorIcon },
                        { id: 'predictor', name: 'Target Target AI', icon: ArrowTrendingUpIcon },
                        { id: 'history', name: 'Grades History', icon: ClockIcon }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-dark'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Calculator Tab */}
                {activeTab === 'calculator' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Grade Entry Form */}
                        <div className="lg:col-span-2">
                            <div className="card p-8 rounded-3xl border-border-strong relative">
                                <h2 className="text-2xl font-display font-bold mb-8 text-text-primary">Input Grades</h2>

                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                                    const semesterData = branchCourses.get(sem);
                                    if (!semesterData) return null;

                                    const semGrades = grades.filter(g => g.semester === sem);
                                    const isExpanded = expandedSemesters.has(sem);
                                    const completedCount = semGrades.filter(g => g.gradePoint > 0).length;
                                    const totalCourses = semesterData.courses.length;
                                    const progress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;

                                    return (
                                        <div key={sem} className="mb-4 last:mb-0 border border-border rounded-2xl overflow-hidden bg-surface transition-all duration-300 hover:border-border-strong">
                                            <button
                                                onClick={() => toggleSemester(sem)}
                                                className="w-full flex items-center justify-between p-5 transition-colors relative"
                                            >
                                                <div className="absolute bottom-0 left-0 h-0.5 bg-primary-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                                                <div className="flex items-center space-x-5">
                                                    <span className="text-lg font-display font-bold text-text-primary">Semester {sem}</span>
                                                    <span className="text-sm font-medium text-text-muted bg-bg px-3 py-1 rounded-full border border-border">
                                                        {completedCount}/{totalCourses} courses
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-sm font-mono font-medium text-blue bg-blue-dim px-3 py-1 rounded-md">
                                                        {semesterData.totalCredits} CR
                                                    </span>
                                                    <svg
                                                        className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-5 space-y-2 bg-bg border-t border-border">
                                                            {semesterData.courses.map((course: any) => {
                                                                const grade = grades.find(g => g.courseId === course.id);
                                                                return (
                                                                    <div key={course.id} className="flex items-center justify-between p-3 hover:bg-surface rounded-xl transition-colors border border-transparent hover:border-border">
                                                                        <div className="flex-1 pr-4">
                                                                            <p className="font-medium text-text-primary mb-1">{course.course_name}</p>
                                                                            <div className="flex items-center gap-2 text-xs font-mono">
                                                                                <span className="text-text-muted bg-surface-dark px-2 py-0.5 rounded">{course.course_code}</span>
                                                                                <span className="text-text-muted">{course.credits} Cr</span>
                                                                                <span className={`px-2 py-0.5 rounded ${course.course_type === 'PC' ? 'bg-blue/10 text-blue border border-blue/20' :
                                                                                    course.course_type === 'PE' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                                        course.course_type === 'OE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                                            course.course_type === 'BSC' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                                                                'bg-surface-dark text-text-secondary border border-border'
                                                                                    }`}>
                                                                                    {course.course_type}
                                                                                </span>
                                                                                {course.is_lab && (
                                                                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">
                                                                                        Lab
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <select
                                                                            value={grade?.gradePoint ?? ''}
                                                                            onChange={(e) => handleGradeChange(course.id, parseFloat(e.target.value), sem)}
                                                                            className="w-28 p-2.5 bg-surface border border-border text-text-primary rounded-xl focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none font-medium appearance-none cursor-pointer text-center"
                                                                        >
                                                                            <option value="">Grade</option>
                                                                            <option value="10">A+ (10)</option>
                                                                            <option value="9">A (9)</option>
                                                                            <option value="8">B+ (8)</option>
                                                                            <option value="7">B (7)</option>
                                                                            <option value="6">C+ (6)</option>
                                                                            <option value="5">C (5)</option>
                                                                            <option value="4">D (4)</option>
                                                                            <option value="0">F (0)</option>
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}

                                <div className="mt-8 space-y-4">
                                    {error && (
                                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                                            {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={calculateResults}
                                        disabled={loading || saving}
                                        style={buttonStyles.primary}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
                                        }}
                                    >
                                        {loading || saving ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <div className="animate-spin" style={{
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                    border: '2px solid white',
                                                    borderTopColor: 'transparent',
                                                    borderRadius: '50%'
                                                }} />
                                                <span>{loading ? 'Calculating...' : 'Saving...'}</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <CalculatorIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                                                <span>Calculate My CGPA</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Display */}
                        <div className="lg:col-span-1">
                            {cgpaResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="card p-8 rounded-3xl border-border-strong sticky top-24 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

                                    <h2 className="text-xl font-display font-bold mb-8 text-text-primary">Calculation Matrix</h2>

                                    <div className="text-center mb-10">
                                        <div className="relative inline-block mb-3">
                                            <div className="absolute inset-0 bg-blue/20 blur-xl rounded-full"></div>
                                            <div className={`text-7xl font-display font-bold tracking-tighter relative z-10 ${getCGPAStatusColor(cgpaResult.currentCGPA)}`}>
                                                {cgpaResult.currentCGPA}
                                            </div>
                                        </div>
                                        <p className="text-text-secondary font-medium tracking-wide uppercase text-sm">Aggregate CGPA</p>
                                        <div className="mt-4 flex justify-center">
                                            {cgpaResult.currentCGPA >= 9 && <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Excellent</span>}
                                            {cgpaResult.currentCGPA >= 8 && cgpaResult.currentCGPA < 9 && <span className="px-3 py-1 bg-blue/10 text-blue border border-blue/20 rounded-full text-xs font-bold uppercase tracking-wider">Very Good</span>}
                                            {cgpaResult.currentCGPA >= 7 && cgpaResult.currentCGPA < 8 && <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Good</span>}
                                            {cgpaResult.currentCGPA >= 6 && cgpaResult.currentCGPA < 7 && <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Average</span>}
                                            {cgpaResult.currentCGPA < 6 && <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Needs Improvement</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-10">
                                        <div className="flex justify-between items-center p-3.5 bg-surface border border-border rounded-xl">
                                            <span className="text-text-muted font-medium">Total Credits</span>
                                            <span className="font-mono font-bold text-text-primary">{cgpaResult.totalCredits}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-surface border border-border rounded-xl">
                                            <span className="text-text-muted font-medium">Earned Credits</span>
                                            <span className="font-mono font-bold text-text-primary">{cgpaResult.earnedCredits}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-surface border border-border rounded-xl">
                                            <span className="text-text-muted font-medium">Backlogs</span>
                                            <span className={`font-mono font-bold ${cgpaResult.totalBacklogs > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {cgpaResult.totalBacklogs}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold mb-4 flex items-center text-text-primary">
                                        <ChartBarIcon className="w-5 h-5 mr-2 text-blue" />
                                        Semester Vectors
                                    </h3>
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                        {cgpaResult.semesterResults.map((sem, idx) => (
                                            sem.grades.length > 0 && (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-bold text-text-primary">S{sem.semester}</span>
                                                        {sem.backlogCount ? (
                                                            <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                                                {sem.backlogCount} fl
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-xs text-text-muted font-mono">{sem.earnedCredits} cr</span>
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${getGradeColor(sem.sgpa)}`}>
                                                            {sem.sgpa.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="mt-8 pt-6 border-t border-border">
                                        <button
                                            onClick={() => setActiveTab('predictor')}
                                            className="w-full flex items-center justify-center space-x-2 text-blue hover:text-blue-hover font-semibold transition-colors"
                                        >
                                            <ArrowTrendingUpIcon className="w-4 h-4" />
                                            <span>Launch Target AI Predictor</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* Predictor Tab */}
                {activeTab === 'predictor' && cgpaResult && (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Target Input */}
                        <div className="card p-8 rounded-3xl border-border-strong relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

                            <h2 className="text-2xl font-display font-bold mb-8 flex items-center text-text-primary">
                                <SparklesIcon className="w-6 h-6 mr-3 text-purple-400" />
                                Target Intelligence
                            </h2>

                            <div className="bg-surface border border-border p-6 rounded-2xl mb-8 flex gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Current State</p>
                                    <p className="text-3xl font-display font-bold text-text-primary">{cgpaResult.currentCGPA}</p>
                                </div>
                                <div className="w-px bg-border"></div>
                                <div>
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Progress</p>
                                    <p className="text-2xl font-bold text-text-primary mt-1">
                                        {cgpaResult.semesterResults.filter(s => s.grades.length > 0).length} <span className="text-text-muted text-lg">/ 8</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-text-primary mb-3">
                                    Graduation Target CGPA (out of 10)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetCGPA}
                                        onChange={(e) => setTargetCGPA(e.target.value)}
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        className="w-full p-4 pl-5 bg-surface-dark border-2 border-border-strong text-text-primary rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xl font-bold outline-none"
                                        placeholder="e.g. 8.5"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-mono bg-bg px-2 py-1 rounded text-xs border border-border">
                                        / 10.0
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={analyzeTarget}
                                disabled={!targetCGPA}
                                style={{
                                    ...buttonStyles.secondary,
                                    opacity: !targetCGPA ? 0.5 : 1,
                                    cursor: !targetCGPA ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (targetCGPA) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (targetCGPA) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                    }
                                }}
                                className="w-full flex items-center justify-center space-x-2 mb-8"
                            >
                                <ArrowTrendingUpIcon className="w-5 h-5" />
                                <span>Analyze Target</span>
                            </button>

                            {targetAnalysis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className={`p-5 rounded-xl border ${targetAnalysis.isPossible ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                                        }`}>
                                        <div className="flex items-center mb-3">
                                            {targetAnalysis.isPossible ? (
                                                <CheckCircleIcon className="w-6 h-6 text-green-400 mr-3" />
                                            ) : (
                                                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
                                            )}
                                            <span className={`font-bold text-lg ${targetAnalysis.isPossible ? 'text-green-400' : 'text-red-500'
                                                }`}>
                                                {targetAnalysis.isPossible
                                                    ? 'Target Computable & Achievable'
                                                    : 'Mathematical Threshold Exceeded'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            To lock in a {targetAnalysis.targetCGPA}, you must sustain an average SGPA of <strong className="text-text-primary bg-surface-dark px-2 border border-border rounded font-mono mx-1">{targetAnalysis.requiredAverageSGPA}</strong>
                                            across the remaining {targetAnalysis.remainingSemesters} semesters
                                            ({targetAnalysis.remainingCredits} credits).
                                        </p>
                                    </div>

                                    {targetAnalysis.gradeSuggestions.length > 0 && (
                                        <div className="bg-blue/5 p-5 rounded-xl border border-blue/20">
                                            <h4 className="font-bold text-blue mb-4 flex items-center text-sm uppercase tracking-wider">
                                                <SparklesIcon className="w-5 h-5 mr-2" />
                                                AI Grade Strategy
                                            </h4>
                                            <div className="space-y-3">
                                                {targetAnalysis.gradeSuggestions.map((suggestion, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface border border-border p-4 rounded-lg gap-2">
                                                        <span className="text-sm font-bold text-text-primary">Semester {suggestion.semester}</span>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="text-xs text-text-muted">Aim for</span>
                                                            <span className="font-mono font-bold text-blue bg-blue-dim px-2 py-0.5 rounded border border-blue/20">
                                                                {suggestion.suggestedGrades['Target'] === 10 ? 'A+' :
                                                                    suggestion.suggestedGrades['Target'] === 9 ? 'A' :
                                                                        suggestion.suggestedGrades['Target'] === 8 ? 'B+' :
                                                                            suggestion.suggestedGrades['Target'] === 7 ? 'B' :
                                                                                suggestion.suggestedGrades['Target'] === 6 ? 'C+' : 'C'}
                                                            </span>
                                                            <span className="text-xs text-text-muted">
                                                                (min {suggestion.suggestedGrades['Minimum Grade']} pts)
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 p-4 bg-surface-dark border border-border-strong rounded-xl text-xs font-mono text-text-muted">
                                        <p className="text-purple-400 mb-1">{"// System Debug Info"}</p>
                                        <p>&gt; Required Avg: {targetAnalysis.requiredAverageSGPA}</p>
                                        <p>&gt; Remaining: {targetAnalysis.remainingSemesters} sems / {targetAnalysis.remainingCredits} cr</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Detailed Breakdown */}
                        {targetAnalysis && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="card p-8 rounded-3xl border-border-strong"
                            >
                                <h2 className="text-2xl font-display font-bold mb-8 text-text-primary">Trajectory Map</h2>

                                <div className="space-y-3">
                                    {targetAnalysis.semesterWiseBreakdown.map((sem, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-xl border transition-all ${sem.currentStatus === 'completed'
                                                ? 'bg-surface border-border opacity-70'
                                                : 'bg-surface border-purple-500/30 shadow-[0_4px_15px_rgba(168,85,247,0.05)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-bold text-text-primary">S{sem.semester}</span>
                                                    {sem.currentStatus === 'completed' ? (
                                                        <span className="px-2 py-0.5 bg-surface-dark text-text-muted border border-border rounded text-[10px] font-bold uppercase tracking-widest">Locked</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase tracking-widest">Target</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-mono text-text-muted">{sem.credits} credits</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-text-secondary">Required SGPA:</span>
                                                <span className={`text-xl font-mono font-bold ${sem.currentStatus === 'completed' ? 'text-text-primary' : 'text-purple-400'
                                                    }`}>
                                                    {sem.requiredSGPA}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 bg-gradient-to-br from-surface to-surface-dark border border-border-strong rounded-2xl">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted mb-4">Mission Parameters</h3>
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div>
                                            <p className="text-xs text-text-secondary mb-1">Current State</p>
                                            <p className="text-2xl font-mono font-bold text-text-primary">{targetAnalysis.currentCGPA}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary mb-1">Target Lock</p>
                                            <p className="text-2xl font-mono font-bold text-text-primary">{targetAnalysis.targetCGPA}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary mb-1">Velocity Needed</p>
                                            <p className="text-xl font-mono font-bold text-purple-400">{targetAnalysis.requiredAverageSGPA}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary mb-1">Time Remaining</p>
                                            <p className="text-xl font-mono font-bold text-text-primary">{targetAnalysis.remainingSemesters} sems</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && cgpaResult && (
                    <div className="card p-8 rounded-3xl border-border-strong w-full max-w-4xl mx-auto">
                        <h2 className="text-2xl font-display font-bold mb-8 text-text-primary">Academic Ledger</h2>

                        <div className="space-y-8">
                            {cgpaResult.semesterResults.map((sem, idx) => (
                                sem.grades.length > 0 && (
                                    <div key={idx} className="border border-border rounded-2xl overflow-hidden bg-surface">
                                        <div className="bg-surface-dark p-5 border-b border-border flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-display font-bold text-text-primary">Semester {sem.semester}</span>
                                                <span className={`px-3 py-1 rounded border text-sm font-bold font-mono tracking-tight ${getGradeColor(sem.sgpa)}`}>
                                                    SGPA: {sem.sgpa.toFixed(2)}
                                                </span>
                                                {sem.backlogCount ? (
                                                    <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                                        {sem.backlogCount} fl
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span className="text-sm font-mono text-text-muted">
                                                {sem.earnedCredits}/{sem.totalCredits} CR
                                            </span>
                                        </div>

                                        <div className="p-0 overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-surface text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                                                    <tr>
                                                        <th className="px-5 py-4">Course</th>
                                                        <th className="px-5 py-4 w-1/2">Title</th>
                                                        <th className="px-5 py-4 text-center">Cr</th>
                                                        <th className="px-5 py-4 text-center">Points</th>
                                                        <th className="px-5 py-4 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border text-sm">
                                                    {sem.grades.map((grade, gidx) => (
                                                        <tr key={gidx} className="hover:bg-surface-dark transition-colors">
                                                            <td className="px-5 py-4 font-mono text-text-secondary">{grade.courseCode}</td>
                                                            <td className="px-5 py-4 font-medium text-text-primary">{grade.courseName}</td>
                                                            <td className="px-5 py-4 text-center font-mono text-text-muted">{grade.credits}</td>
                                                            <td className="px-5 py-4 text-center">
                                                                <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded text-xs font-bold font-mono border ${grade.gradePoint === 10 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                    grade.gradePoint >= 8 ? 'bg-blue/10 text-blue border-blue/20' :
                                                                        grade.gradePoint >= 6 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                            grade.gradePoint >= 4 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                                                    }`}>
                                                                    {grade.gradePoint}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                {grade.gradePoint === 0 ? (
                                                                    <span className="text-red-500 font-bold text-xs uppercase tracking-wider">Fail</span>
                                                                ) : (
                                                                    <span className="text-green-500 font-bold text-xs uppercase tracking-wider">Clear</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>

                        {/* Overall Statistics */}
                        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-surface border border-border p-5 rounded-2xl">
                                <p className="text-3xl font-display font-bold text-blue mb-1">{cgpaResult.currentCGPA}</p>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Aggregate CGPA</p>
                            </div>
                            <div className="bg-surface border border-border p-5 rounded-2xl">
                                <p className="text-3xl font-display font-bold text-text-primary mb-1">{cgpaResult.earnedCredits}</p>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Credits Earned</p>
                            </div>
                            <div className="bg-surface border border-border p-5 rounded-2xl">
                                <p className="text-3xl font-display font-bold text-text-primary mb-1">
                                    {cgpaResult.semesterResults.filter(s => s.grades.length > 0).length}
                                </p>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Semesters Cleared</p>
                            </div>
                            <div className="bg-surface border border-border p-5 rounded-2xl">
                                <p className={`text-3xl font-display font-bold mb-1 ${cgpaResult.totalBacklogs > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {cgpaResult.totalBacklogs}
                                </p>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Backlogs</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
