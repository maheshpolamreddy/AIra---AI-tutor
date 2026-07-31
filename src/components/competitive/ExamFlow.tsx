import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, FileText, Brain, Target, CheckCircle, XCircle, RefreshCw, Trophy, Calendar, BrainCircuit, Clock, Sparkles } from 'lucide-react';
import { COMPETITIVE_EXAMS, Exam, ExamSubject, Paper } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { Question } from '../../data/competitiveQuestions';
import { aiExamGenerator } from '../../services/aiExamGenerator';
import { EXAM_THEMES } from '../../data/examThemes';
import ExamCard from './ExamCard';
import LiveExamPanel from './LiveExamPanel';
import { useCompetitiveStore } from '../../stores/competitiveStore';


interface ExamFlowProps {
    isDashboardView?: boolean;
    onExamStateChange?: (isActive: boolean) => void;
    flowType?: 'standard' | 'pyq' | 'mock';
}

export default function ExamFlow({ isDashboardView = false, onExamStateChange, flowType = 'standard' }: ExamFlowProps = {}) {
    const navigate = useNavigate();
    const recordAttempt = useCompetitiveStore((s) => s.recordAttempt);
    const recordedRef = useRef(false);
    const [step, setStep] = useState<'exam' | 'subject' | 'paper' | 'solving' | 'result'>('exam');
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    // Exam Logic State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]); // Index of selected option per question
    
    // Real Exam Interface Status Tracking
    const [visitedQuestions, setVisitedQuestions] = useState<boolean[]>([]);
    const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
    const [bookmarked, setBookmarked] = useState<boolean[]>([]);
    const [eliminated, setEliminated] = useState<Record<number, number[]>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});

    const [showExplanation, setShowExplanation] = useState(false);
    /** Remaining seconds while solving (countdown). Also stores elapsed on result. */
    const [timer, setTimer] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Hook to inform parent (CompetitiveDashboard) when we enter/exit exam mode
    useEffect(() => {
        if (onExamStateChange) {
            onExamStateChange(step === 'solving' || step === 'result');
        }
    }, [step, onExamStateChange]);

    // Countdown timer — auto-submit at zero
    useEffect(() => {
        if (step !== 'solving') return;
        const interval = setInterval(() => {
            setElapsedSeconds((e) => e + 1);
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    queueMicrotask(() => setStep('result'));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    // Autosave draft progress while solving
    useEffect(() => {
        if (step !== 'solving' || !selectedExam || !selectedSubject) return;
        try {
            sessionStorage.setItem(
                'aira-exam-draft',
                JSON.stringify({
                    examId: selectedExam.id,
                    subjectId: selectedSubject.id,
                    currentQuestionIndex,
                    userAnswers,
                    markedForReview,
                    bookmarked,
                    notes,
                    timer,
                    savedAt: Date.now(),
                }),
            );
        } catch {
            /* ignore quota */
        }
    }, [
        step,
        selectedExam,
        selectedSubject,
        currentQuestionIndex,
        userAnswers,
        markedForReview,
        bookmarked,
        notes,
        timer,
    ]);

    // Persist attempt once when results open
    useEffect(() => {
        if (step !== 'result' || !selectedExam || !selectedSubject || recordedRef.current) return;
        if (!questions.length) return;
        recordedRef.current = true;
        let score = 0;
        userAnswers.forEach((ans, idx) => {
            if (questions[idx] && ans === questions[idx].correctAnswer) score += 1;
        });
        recordAttempt({
            examId: selectedExam.id,
            examName: selectedExam.name,
            subjectId: selectedSubject.id,
            subjectName: selectedSubject.name,
            mode: flowType === 'pyq' ? 'pyq' : flowType === 'mock' ? 'mock' : 'standard',
            score,
            total: questions.length,
            timeSeconds: elapsedSeconds || Math.max(0, (selectedExam.timeMinutes * 60) - timer),
            paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
        });
        try {
            sessionStorage.removeItem('aira-exam-draft');
        } catch {
            /* ignore */
        }
    }, [
        step,
        selectedExam,
        selectedSubject,
        selectedPaper,
        questions,
        userAnswers,
        elapsedSeconds,
        timer,
        flowType,
        recordAttempt,
    ]);

    const handleBack = () => {
        if (step === 'result') {
            setStep(flowType === 'pyq' ? 'paper' : 'subject');
            resetExam();
        } else if (step === 'solving') {
            const confirmQuit = window.confirm('Leave the exam? Your draft is auto-saved for this browser tab.');
            if (confirmQuit) {
                setStep(flowType === 'pyq' ? 'paper' : 'subject');
                resetExam();
            }
        } else if (step === 'paper') setStep('subject');
        else if (step === 'subject') setStep('exam');
    };

    const resetExam = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setVisitedQuestions([]);
        setMarkedForReview([]);
        setBookmarked([]);
        setEliminated({});
        setNotes({});
        setShowExplanation(false);
        setTimer(0);
        setElapsedSeconds(0);
        recordedRef.current = false;
    };

    const handleExamSelect = (exam: Exam) => {
        setSelectedExam(exam);
        setStep('subject');
    };

    const resolveExamYear = (exam: Exam, paper: Paper | null | undefined) => {
        if (paper?.year != null) return String(paper.year);
        return String(exam.papers?.[0]?.year ?? new Date().getFullYear() - 1);
    };

    const applyQuestionsAndStartSolving = (finalQuestions: Question[], exam: Exam) => {
        setQuestions(finalQuestions);
        setUserAnswers(new Array(finalQuestions.length).fill(-1));
        const initialVisited = new Array(finalQuestions.length).fill(false);
        if (finalQuestions.length > 0) initialVisited[0] = true;
        setVisitedQuestions(initialVisited);
        setMarkedForReview(new Array(finalQuestions.length).fill(false));
        setBookmarked(new Array(finalQuestions.length).fill(false));
        setEliminated({});
        setNotes({});
        setElapsedSeconds(0);
        recordedRef.current = false;
        // Subject-scoped time: proportional share of full paper, minimum 20 minutes
        const share = Math.max(
            20 * 60,
            Math.round((exam.timeMinutes * 60 * (finalQuestions.length || 1)) / Math.max(1, exam.subjects.reduce((s, sub) => s + sub.questionsCount, 0))),
        );
        setTimer(share);
        setStep('solving');
    };

    /** Full AI exam generation: syllabus-aligned, batched, fresh session each call. */
    const generateAndStartExam = async (exam: Exam, subject: ExamSubject, paperOverride?: Paper | null) => {
        setIsGenerating(true);
        try {
            const year = resolveExamYear(exam, paperOverride !== undefined ? paperOverride : selectedPaper);
            const count =
                flowType === 'mock'
                    ? Math.min(subject.questionsCount, Math.max(15, Math.round(subject.questionsCount * 0.6)))
                    : subject.questionsCount;
            const finalQuestions = await aiExamGenerator.generateAIExamPaper({
                examId: exam.id,
                examName: exam.name,
                subjectId: subject.id,
                subjectName: subject.name,
                count,
                examYear: year,
                mode: flowType === 'pyq' ? 'pyq' : 'mock',
            });
            applyQuestionsAndStartSolving(finalQuestions, exam);
        } catch (error) {
            console.error('Failed to generate exam questions:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubjectSelect = async (subject: ExamSubject) => {
        setSelectedSubject(subject);
        if (flowType === 'standard') {
            if (selectedExam) {
                await generateAndStartExam(selectedExam, subject, null);
            }
        } else {
            setStep('paper');
        }
    };

    const handlePaperSelect = async (paper: Paper) => {
        setSelectedPaper(paper);
        if (selectedExam && selectedSubject) {
            await generateAndStartExam(selectedExam, selectedSubject, paper);
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showExplanation) return; // Prevent changing answer after explanation shown (if instant feedback mode)

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const navigateToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        const newVisited = [...visitedQuestions];
        newVisited[index] = true;
        setVisitedQuestions(newVisited);
    };

    const handleClearResponse = () => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = -1;
        setUserAnswers(newAnswers);
    };

    const handleSaveAndNext = () => {
        const newMarked = [...markedForReview];
        newMarked[currentQuestionIndex] = false; // Clearing review mark
        setMarkedForReview(newMarked);

        if (currentQuestionIndex < questions.length - 1) {
            navigateToQuestion(currentQuestionIndex + 1);
        } else {
            setStep('result');
        }
    };

    const handleMarkAndNext = () => {
        const newMarked = [...markedForReview];
        newMarked[currentQuestionIndex] = true;
        setMarkedForReview(newMarked);

        if (currentQuestionIndex < questions.length - 1) {
            navigateToQuestion(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) navigateToQuestion(currentQuestionIndex - 1);
    };

    const handleToggleEliminate = (optionIndex: number) => {
        setEliminated((prev) => {
            const current = prev[currentQuestionIndex] || [];
            const next = current.includes(optionIndex)
                ? current.filter((i) => i !== optionIndex)
                : [...current, optionIndex];
            return { ...prev, [currentQuestionIndex]: next };
        });
        if (userAnswers[currentQuestionIndex] === optionIndex) {
            handleClearResponse();
        }
    };

    const handleToggleBookmark = () => {
        setBookmarked((prev) => {
            const next = [...prev];
            next[currentQuestionIndex] = !next[currentQuestionIndex];
            return next;
        });
    };

    const handleNoteChange = (text: string) => {
        setNotes((prev) => ({ ...prev, [currentQuestionIndex]: text }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateScore = () => {
        let correct = 0;
        try {
            userAnswers.forEach((ans, idx) => {
                const q = questions[idx];
                if (q && typeof q.correctAnswer === 'number' && ans === q.correctAnswer) {
                    correct++;
                }
            });
        } catch (e) {
            console.error('Score calculation failed:', e);
        }
        return correct;
    };

    const activeTheme = selectedExam && EXAM_THEMES[selectedExam.id] ? EXAM_THEMES[selectedExam.id] : EXAM_THEMES['gate'];

    return (
        <div className={`w-full relative ${isDashboardView && step === 'solving' ? 'min-h-screen' : ''}`}>
            <AnimatePresence mode="wait">
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
                    >
                        <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-ping opacity-75" />
                            <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent animate-spin" />
                            <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Generating AI Exam...</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 max-w-sm text-center">
                            Crafting high-quality, perfectly aligned questions for a fresh practice experience.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Breadcrumbs — hidden during live exam for immersion */}
            {step !== 'solving' && (
            <div className="flex items-center justify-between gap-3 mb-8 p-1.5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3">
                    {(step !== 'exam') && (
                        <button
                            onClick={handleBack}
                            className="p-2 lg:p-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-2xl transition-all active:scale-95 flex items-center gap-2 group border border-slate-200 dark:border-slate-700 hover:border-indigo-200 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Back to Exams</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 h-8 px-2 whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'exam' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>Exams</span>
    
                        {selectedExam && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'subject' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedExam.name}</span>
                            </>
                        )}
    
                        {selectedSubject && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'paper' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedSubject.name}</span>
                            </>
                        )}
    
                        {selectedPaper && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'result' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedPaper.year}</span>
                            </>
                        )}
    
                        {step === 'result' && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: activeTheme.color }}>Report</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Quick Selection Dropdown */}
                {step === 'exam' && (
                    <div className="lg:hidden pr-2">
                        <select 
                            onChange={(e) => {
                                const exam = COMPETITIVE_EXAMS.find(ex => ex.id === e.target.value);
                                if (exam) handleExamSelect(exam);
                            }}
                            className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                            value=""
                        >
                            <option value="" disabled>Quick Select Exam</option>
                            {COMPETITIVE_EXAMS.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            )}

            {/* Content Display */}
            <div className="relative">
                {/* Step 1: Exam Selection */}
                {step === 'exam' && (
                    <motion.div
                        key="exam"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        <div className="mb-8 hidden lg:block">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                                {flowType === 'mock' ? 'Full-length mocks' : flowType === 'pyq' ? 'Previous year papers' : 'Available exams'}
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                {flowType === 'mock'
                                    ? 'Timed simulation papers with exam-style pressure and negative marking.'
                                    : flowType === 'pyq'
                                      ? 'Authentic year-tagged papers to master recurring patterns.'
                                      : 'Choose your target examination — each card carries a distinct identity and syllabus path.'}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {COMPETITIVE_EXAMS.map((exam, i) => (
                                <ExamCard
                                    key={exam.id}
                                    exam={exam}
                                    index={i}
                                    badge={flowType === 'mock' ? 'Mock' : flowType === 'pyq' ? 'PYQ' : undefined}
                                    onSelect={handleExamSelect}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Subject Selection */}
                {step === 'subject' && selectedExam && (
                    <motion.div
                        key="subject"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        <div className="mb-10 flex flex-col items-center text-center">
                            <span className="px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-100 dark:border-indigo-800/50">
                                Domain Selection
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-3">Choose Your Subject</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">Focus your practice sessions on specific core disciplines for the {selectedExam.name} examination.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {selectedExam.subjects.map((subject, i) => {
                                const theme = EXAM_THEMES[selectedExam.id] || EXAM_THEMES['gate'];
                                
                                const SUBJECT_IMAGES: Record<string, string> = {
                                    'phy': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'chem': '/tutor-media/images/subjects/chemistry.png',
                                    'chemistry': '/tutor-media/images/subjects/chemistry.png',
                                    'math': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'bot': '/tutor-media/images/subjects/botany.png',
                                    'botany': '/tutor-media/images/subjects/botany.png',
                                    'zoo': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'zoology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'mat': 'https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?q=80&w=800&auto=format&fit=crop',
                                    'sat-sci': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'sat-sst': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop',
                                    'sat-math': 'https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=800&auto=format&fit=crop',
                                    'sci': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'eng': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'english': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'intel': 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=800&auto=format&fit=crop', // Intelligence/puzzle
                                    'gk': 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format&fit=crop', // General Knowledge/Globe
                                    'arith': 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?q=80&w=800&auto=format&fit=crop', // Arithmetic/Calculator
                                    'hin': 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=800&auto=format&fit=crop', // Hindi/Culture
                                    'sst': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop', // Social Science/History
                                    'lang': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop', // Language
                                    'default': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'
                                };
                                const bgUrl = SUBJECT_IMAGES[subject.id.trim().toLowerCase()] || SUBJECT_IMAGES[subject.name.trim().toLowerCase()] || SUBJECT_IMAGES['default'];

                                return (
                                    <motion.div
                                        key={subject.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                                    >
                                        <button
                                            onClick={() => handleSubjectSelect(subject)}
                                            className="w-full relative overflow-hidden group rounded-[2.5rem] bg-white dark:bg-slate-900 border-4 border-transparent text-left transition-all duration-500 shadow-xl hover:shadow-2xl flex flex-col min-h-[220px]"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = `${theme.color}30`;
                                                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'transparent';
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            }}
                                        >
                                            {/* Visual Background */}
                                            <div className="absolute inset-0 w-full h-full">
                                                <div 
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                                    style={{ backgroundImage: `url(${bgUrl})` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-transparent dark:from-slate-900/60 dark:via-slate-900/40 dark:to-transparent opacity-100 group-hover:opacity-80 transition-opacity" />
                                            </div>

                                            <div className="relative z-10 p-8 flex flex-col h-full w-full">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div
                                                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:-rotate-12 transition-all duration-500 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
                                                        style={{ color: theme.color }}
                                                    >
                                                        <BrainCircuit className="w-8 h-8" />
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center group-hover:bg-indigo-500 transition-all shadow-sm group-hover:scale-110">
                                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    <h3 className="font-black text-3xl text-gray-900 dark:text-white tracking-tighter mb-2 group-hover:translate-x-2 transition-transform">
                                                        {subject.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform delay-75">
                                                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                            {subject.questionsCount} Practice Questions
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Paper Selection */}
                {step === 'paper' && selectedExam && (
                    <motion.div
                        key="paper"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <div className="mb-10 p-10 rounded-[3rem] bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-150" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: activeTheme.color }}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Question Repository</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-3">Previous Year Papers</h2>
                                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Authentic {selectedExam.name} papers curated to simulate the real examination environment.</p>
                                </div>
                                <div className="flex bg-slate-50 dark:bg-slate-800/80 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 gap-8">
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Papers</div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedExam.papers.length}</div>
                                    </div>
                                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Limit</div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedExam.timeMinutes}m</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {selectedExam.papers.map((paper: Paper, i: number) => {
                                const theme = EXAM_THEMES[selectedExam?.id || 'gate'];
                                return (
                                    <motion.div
                                        key={paper.year}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                                    >
                                        <button
                                            onClick={() => handlePaperSelect(paper)}
                                            className="w-full relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-transparent text-center group overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = `${theme.color}40`;
                                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'transparent';
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: theme.color }} />
                                            
                                            <div 
                                                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all duration-700 group-hover:rotate-[360deg] shadow-lg border border-slate-100 dark:border-slate-800"
                                                style={{ backgroundColor: `${theme.color}10`, color: theme.color }}
                                            >
                                                <Calendar className="w-8 h-8" />
                                            </div>

                                            <span className="block font-black text-4xl text-gray-900 dark:text-white tracking-tighter mb-2 group-hover:scale-110 transition-transform">
                                                {paper.year}
                                            </span>
                                            
                                            <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                                                Shift {paper.shift || '1'}
                                            </div>
                                            
                                            {/* Hover decoration */}
                                            <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 5: Live examination panel */}
                {step === 'solving' && questions.length > 0 && selectedExam && selectedSubject && (
                    <motion.div
                        key="solving"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.985 }}
                    >
                        <LiveExamPanel
                            exam={selectedExam}
                            subjectName={selectedSubject.name}
                            questions={questions}
                            currentQuestionIndex={currentQuestionIndex}
                            userAnswers={userAnswers}
                            visitedQuestions={visitedQuestions}
                            markedForReview={markedForReview}
                            timeLeftSeconds={timer}
                            isLowTime={timer <= 5 * 60}
                            eliminated={eliminated}
                            bookmarked={bookmarked}
                            notes={notes}
                            onAnswerSelect={handleAnswerSelect}
                            onNavigate={navigateToQuestion}
                            onClear={handleClearResponse}
                            onSaveAndNext={handleSaveAndNext}
                            onMarkAndNext={handleMarkAndNext}
                            onPrevious={handlePrevious}
                            onSubmit={() => setStep('result')}
                            onToggleEliminate={handleToggleEliminate}
                            onToggleBookmark={handleToggleBookmark}
                            onNoteChange={handleNoteChange}
                        />
                    </motion.div>
                )}

                {/* Step 6: Result Screen */}
                {step === 'result' && (
                    <div className="space-y-12 transition-all duration-500 opacity-100">
                        <div
                            className="rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 dark:border-slate-700/50 p-10 sm:p-14 text-center relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl"
                        >
                            {/* Animated Background Artifacts */}
                            <motion.div
                                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
                                style={{ backgroundColor: activeTheme.color, opacity: 0.15 }}
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                transition={{ duration: 15, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
                                style={{ backgroundColor: activeTheme.color, opacity: 0.1 }}
                                animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                                transition={{ duration: 20, repeat: Infinity }}
                            />

                            <div className="relative z-10 max-w-4xl mx-auto">
                                <motion.div
                                    className={`w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/40 dark:border-white/10`}
                                    initial={{ y: 30, rotate: -20, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${activeTheme.color}, ${activeTheme.color}dd)`,
                                        boxShadow: `0 20px 40px ${activeTheme.color}40, inset 0 2px 0 ${activeTheme.color}aa`
                                    }}
                                >
                                    <Trophy className="w-14 h-14 text-white drop-shadow-md" />
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight drop-shadow-sm">
                                        Performance Report
                                    </h2>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-lg font-medium mb-14">
                                        <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-inner">
                                            {selectedExam?.name || 'Session'}
                                        </span>
                                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                                        <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-inner">
                                            {selectedSubject?.name || 'Subject'}
                                        </span>
                                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                                        <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-inner" style={{ color: activeTheme.color }}>
                                            {selectedPaper?.year}
                                        </span>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
                                    {[
                                        { icon: <Target />, value: `${calculateScore()} / ${questions.length}`, label: 'Score Index', delay: 0.3 },
                                        { icon: <CheckCircle />, value: `${Math.round((calculateScore() / questions.length) * 100)}%`, label: 'Accuracy Rate', delay: 0.4 },
                                        { icon: <Clock />, value: formatTime(elapsedSeconds || Math.max(0, (selectedExam?.timeMinutes || 0) * 60 - timer)), label: 'Time Invested', delay: 0.5 }
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: 30, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: stat.delay, type: 'spring', damping: 20 }}
                                            className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center hover:scale-[1.03] transition-all duration-500 shadow-sm hover:shadow-xl overflow-hidden"
                                        >
                                            {/* Hover Glow */}
                                            <div 
                                                className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none"
                                                style={{ backgroundImage: `radial-gradient(circle at center, ${activeTheme.color}, transparent)` }}
                                            />
                                            
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div 
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 shadow-sm border border-black/5 dark:border-white/10"
                                                    style={{ backgroundColor: activeTheme.bgColor, color: activeTheme.color }}
                                                >
                                                    {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-7 h-7' })}
                                                </div>
                                                <span className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter tabular-nums text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text transition-colors duration-300"
                                                    style={{ backgroundImage: `linear-gradient(to right, ${activeTheme.color}, ${activeTheme.color})`, WebkitBackgroundClip: 'text' }}>
                                                    {stat.value}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div 
                                    className="flex flex-wrap items-center justify-center gap-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <button onClick={() => { setStep('paper'); resetExam(); }} className="flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[2rem] font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md">
                                        <ArrowLeft className="w-4 h-4" /> Another Year
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isGenerating}
                                        onClick={() => {
                                            if (!selectedExam || !selectedSubject) return;
                                            void (async () => {
                                                resetExam();
                                                await generateAndStartExam(
                                                    selectedExam,
                                                    selectedSubject,
                                                    flowType === 'pyq' ? selectedPaper : null
                                                );
                                            })();
                                        }}
                                        className={`flex items-center gap-4 px-12 py-5 text-white rounded-[2rem] font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none`}
                                        style={{ background: `linear-gradient(to right, ${activeTheme.color}, ${activeTheme.color}dd)`, boxShadow: `0 15px 30px -10px ${activeTheme.color}80` }}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} /> {isGenerating ? 'Generating…' : 'Retake Test'}
                                    </button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Detailed Answer Sheet Section */}
                        <div className="space-y-12">
                            <div className="flex items-center gap-8 px-10">
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-3xl tracking-tight">Step-by-Step Answer Sheet</h3>
                                </div>
                                <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {questions.map((q: Question, idx: number) => {
                                    const isCorrect = userAnswers[idx] === q.correctAnswer;
                                    const explanationSteps = (q.explanation || "").split('\n').filter((step: string) => step.trim().length > 0);

                                    return (
                                        <motion.div
                                            key={q.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1, type: "spring", damping: 25 }}
                                            className={`group p-8 sm:p-10 rounded-[3rem] bg-white dark:bg-slate-900 border-2 transition-all hover:shadow-xl ${isCorrect
                                                ? 'border-emerald-500/20 hover:border-emerald-500/40'
                                                : 'border-rose-500/20 hover:border-rose-500/40'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                            Question {idx + 1}
                                                        </span>
                                                        <span className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                            {q.difficulty}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-2xl sm:text-3xl text-gray-900 dark:text-slate-100 leading-[1.25] tracking-tight">{q.text}</h4>
                                                </div>

                                                <motion.div
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isCorrect ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'}`}
                                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                                    transition={{ duration: 0.8, ease: "anticipate" }}
                                                >
                                                    {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                                </motion.div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                                <div className={`p-8 rounded-[2rem] border-2 shadow-sm transition-all relative overflow-hidden ${isCorrect
                                                    ? 'bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-rose-500/5 dark:bg-rose-500/5 border-rose-500/20'
                                                    }`}>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-3 opacity-40">Your Selection</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                            {userAnswers[idx] !== -1 ? String.fromCharCode(65 + userAnswers[idx]) : '?'}
                                                        </div>
                                                        <span className={`text-xl font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                                            {userAnswers[idx] !== -1 ? q.options[userAnswers[idx]] : 'Unattempted'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-8 rounded-[2rem] border-2 bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20 shadow-sm relative overflow-hidden">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-3 opacity-40">Correct Solution</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black">
                                                            {String.fromCharCode(65 + q.correctAnswer)}
                                                        </div>
                                                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                                            {q.options[q.correctAnswer]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 sm:p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: activeTheme.color }}>
                                                        <Brain className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: activeTheme.color }}>Detailed Explanation</h5>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Step-by-step logic</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6 relative z-10">
                                                    {explanationSteps.map((stepText: string, sIdx: number) => (
                                                        <motion.div
                                                            key={sIdx}
                                                            className="flex gap-6 group/step"
                                                            initial={{ opacity: 0, x: -10 }}
                                                            whileInView={{ opacity: 1, x: 0 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: 0.1 * sIdx }}
                                                        >
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div
                                                                    className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 flex items-center justify-center text-[10px] font-black shrink-0 transition-all"
                                                                    style={{ borderColor: `${activeTheme.color}30`, color: activeTheme.color }}
                                                                >
                                                                    {sIdx + 1}
                                                                </div>
                                                                {sIdx < explanationSteps.length - 1 && (
                                                                    <div className="w-0.5 h-full opacity-20" style={{ backgroundColor: activeTheme.color }} />
                                                                )}
                                                            </div>
                                                            <p className="text-lg font-medium leading-[1.6] text-slate-700 dark:text-slate-300 antialiased pt-0.5">
                                                                {stepText.trim()}
                                                            </p>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {/* Background Decorative Element */}
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05]">
                                                    <Sparkles className="w-24 h-24" style={{ color: activeTheme.color }} />
                                                </div>
                                                
                                                {/* Explain with AI Button */}
                                                <div className="mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 relative z-10 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // MUST strip the non-serializable React Node (icon) to prevent DataCloneError
                                                            const { icon: _icon, ...serializableTheme } = activeTheme;
                                                            void _icon;
                                                            navigate('/student/competitive-explain', { 
                                                                state: { 
                                                                    competitiveQuestion: q, 
                                                                    theme: serializableTheme,
                                                                    userAnswer: userAnswers[idx],
                                                                    examName: selectedExam?.name
                                                                } 
                                                            });
                                                        }}
                                                        className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-bold relative overflow-hidden shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                        style={{ 
                                                            background: `linear-gradient(135deg, ${activeTheme.color}, ${activeTheme.color}ee)`,
                                                            boxShadow: `0 10px 25px -5px ${activeTheme.color}50`
                                                        }}
                                                    >
                                                        {/* Sparkle shine effect */}
                                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                                        
                                                        <Sparkles className="w-5 h-5 relative z-10 drop-shadow-sm" />
                                                        <span className="relative z-10 tracking-wide text-[15px]">Explain with AI</span>
                                                        <ChevronRight className="w-4 h-4 relative z-10 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Diagnostic Helper (Removed from user view since fixed) */}
        </div>
    );
}
