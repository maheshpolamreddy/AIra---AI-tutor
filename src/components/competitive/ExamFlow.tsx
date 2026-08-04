import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, FileText, Brain, Target, CheckCircle, XCircle, RefreshCw, Trophy, Calendar, BrainCircuit, Clock, Sparkles } from 'lucide-react';
import { COMPETITIVE_EXAMS, Exam, ExamSubject, Paper } from '../../data/mockData';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Question } from '../../data/competitiveQuestions';
import { aiExamGenerator } from '../../services/aiExamGenerator';
import { EXAM_THEMES } from '../../data/examThemes';
import ExamCard from './ExamCard';
import LiveExamPanel from './LiveExamPanel';
import { useCompetitiveStore } from '../../stores/competitiveStore';
import { PremiumMetricCard, PremiumSelectionCard } from './CompetitiveCards';
import type { WeeklyExamSession } from '../../types/weeklyExam';
import { isSessionLive } from '../../services/weeklyExamSchedule';
import { toast } from '../../stores/toastStore';
import {
    clearExamDraft,
    findExam,
    findPaper,
    findSubject,
    loadExamDraft,
    normalizeExamStep,
    saveExamDraft,
    saveExplainPayload,
    type ExamDraft,
    type ExamFlowStep,
} from '../../lib/competitiveRoute';


interface ExamFlowProps {
    isDashboardView?: boolean;
    onExamStateChange?: (isActive: boolean) => void;
    flowType?: 'standard' | 'pyq' | 'mock' | 'weekly';
    weeklySession?: WeeklyExamSession | null;
}

export default function ExamFlow({
    isDashboardView = false,
    onExamStateChange,
    flowType = 'standard',
    weeklySession = null,
}: ExamFlowProps = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const recordAttempt = useCompetitiveStore((s) => s.recordAttempt);
    const weeklyAutoStartedRef = useRef(false);
    const generationIdRef = useRef(0);
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            generationIdRef.current += 1;
        };
    }, []);
    const paperFlow = flowType === 'pyq' || (flowType === 'weekly' && weeklySession?.mode === 'pyq');
    const mockFlow = flowType === 'mock' || (flowType === 'weekly' && weeklySession?.mode === 'mock');

    /**
     * The flow is addressed entirely by the URL, so a refresh or a back button
     * press lands on the same screen instead of resetting to the catalog.
     */
    const step = normalizeExamStep(searchParams.get('step'));
    const selectedExam = useMemo(() => findExam(searchParams.get('exam')), [searchParams]);
    const selectedSubject = useMemo(
        () => findSubject(selectedExam, searchParams.get('subject')),
        [selectedExam, searchParams],
    );
    const selectedPaper = useMemo(
        () => findPaper(selectedExam, searchParams.get('paper')),
        [selectedExam, searchParams],
    );

    const updateFlowParams = useCallback(
        (updates: Record<string, string | null>, options: { replace?: boolean } = {}) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(updates).forEach(([key, value]) => {
                        if (value === null) next.delete(key);
                        else next.set(key, value);
                    });
                    return next;
                },
                { replace: options.replace ?? false },
            );
        },
        [setSearchParams],
    );

    const goToStep = useCallback(
        (
            next: ExamFlowStep,
            updates: Record<string, string | null> = {},
            options: { replace?: boolean } = {},
        ) => {
            const base: Record<string, string | null> =
                next === 'exam'
                    ? { step: null, exam: null, subject: null, paper: null }
                    : { step: next };
            updateFlowParams({ ...base, ...updates }, options);
        },
        [updateFlowParams],
    );

    /**
     * A live paper cannot live in the URL, so it is mirrored into sessionStorage
     * and read back synchronously on the first render of a resumed session.
     */
    const initialDraftRef = useRef<ExamDraft | null | undefined>(undefined);
    if (initialDraftRef.current === undefined) {
        const params = new URLSearchParams(window.location.search);
        const urlStep = normalizeExamStep(params.get('step'));
        const draft = urlStep === 'solving' || urlStep === 'result' ? loadExamDraft(flowType) : null;
        initialDraftRef.current =
            draft && draft.examId === params.get('exam') && draft.subjectId === params.get('subject')
                ? draft
                : null;
    }
    const initialDraft = initialDraftRef.current;

    // A resumed scorecard was already written to analytics before the reload,
    // so it must not be counted a second time.
    const recordedRef = useRef(initialDraft?.step === 'result');

    // Exam Logic State
    const [questions, setQuestions] = useState<Question[]>(() => initialDraft?.questions ?? []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
        () => initialDraft?.currentQuestionIndex ?? 0,
    );
    const [userAnswers, setUserAnswers] = useState<number[]>(() => initialDraft?.userAnswers ?? []); // Index of selected option per question

    // Real Exam Interface Status Tracking
    const [visitedQuestions, setVisitedQuestions] = useState<boolean[]>(
        () => initialDraft?.visitedQuestions ?? [],
    );
    const [markedForReview, setMarkedForReview] = useState<boolean[]>(
        () => initialDraft?.markedForReview ?? [],
    );
    const [bookmarked, setBookmarked] = useState<boolean[]>(() => initialDraft?.bookmarked ?? []);
    const [eliminated, setEliminated] = useState<Record<number, number[]>>(
        () => initialDraft?.eliminated ?? {},
    );
    const [notes, setNotes] = useState<Record<number, string>>(() => initialDraft?.notes ?? {});

    const [showExplanation, setShowExplanation] = useState(false);
    /** Remaining seconds while solving (countdown). Also stores elapsed on result. */
    const [timer, setTimer] = useState(() => initialDraft?.timer ?? 0);
    const [elapsedSeconds, setElapsedSeconds] = useState(() => initialDraft?.elapsedSeconds ?? 0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
    const timerRef = useRef(timer);
    const elapsedRef = useRef(elapsedSeconds);
    timerRef.current = timer;
    elapsedRef.current = elapsedSeconds;

    // Hook to inform parent (CompetitiveDashboard) when we enter/exit exam mode
    useEffect(() => {
        onExamStateChange?.(step === 'solving' || step === 'result');
    }, [step, onExamStateChange]);

    // Leaving the section entirely must release the immersive layout.
    useEffect(() => () => onExamStateChange?.(false), [onExamStateChange]);

    /**
     * Repairs URLs that cannot be rendered — a hand-edited link, a stale
     * bookmark, or a resumed tab whose exam draft has expired.
     */
    useEffect(() => {
        if (isGenerating) return;

        if (step === 'subject' && !selectedExam) {
            goToStep('exam', {}, { replace: true });
            return;
        }
        if (step === 'paper' && (!selectedExam || !selectedSubject || flowType === 'standard')) {
            goToStep(selectedExam ? 'subject' : 'exam', {}, { replace: true });
            return;
        }
        if ((step === 'solving' || step === 'result') && questions.length === 0) {
            if (!selectedExam) goToStep('exam', {}, { replace: true });
            else if (!selectedSubject) goToStep('subject', {}, { replace: true });
            else goToStep(paperFlow ? 'paper' : 'subject', {}, { replace: true });
        }
    }, [step, selectedExam, selectedSubject, questions.length, isGenerating, flowType, paperFlow, goToStep]);

    // A reload mid-paper would silently discard the attempt without a prompt.
    useEffect(() => {
        if (step !== 'solving') return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [step]);

    // Countdown timer — auto-submit at zero
    useEffect(() => {
        if (step !== 'solving') return;
        const interval = setInterval(() => {
            setElapsedSeconds((e) => e + 1);
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    queueMicrotask(() => goToStep('result', {}, { replace: true }));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step, goToStep]);

    // Autosave draft while solving. Answer/bookmark changes save quickly;
    // timer progress is included via refs and flushed on a 5s cadence.
    useEffect(() => {
        if (step !== 'solving' || !selectedExam || !selectedSubject || !questions.length) return;
        const handle = window.setTimeout(() => {
            saveExamDraft({
                version: 2,
                flowType,
                examId: selectedExam.id,
                subjectId: selectedSubject.id,
                paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
                step: 'solving',
                questions,
                currentQuestionIndex,
                userAnswers,
                visitedQuestions,
                markedForReview,
                bookmarked,
                eliminated,
                notes,
                timer: timerRef.current,
                elapsedSeconds: elapsedRef.current,
                savedAt: Date.now(),
            });
        }, 400);
        return () => window.clearTimeout(handle);
    }, [
        step,
        flowType,
        selectedExam,
        selectedSubject,
        selectedPaper,
        questions,
        currentQuestionIndex,
        userAnswers,
        visitedQuestions,
        markedForReview,
        bookmarked,
        eliminated,
        notes,
    ]);

    useEffect(() => {
        if (step !== 'solving' || !selectedExam || !selectedSubject || !questions.length) return;
        const handle = window.setInterval(() => {
            saveExamDraft({
                version: 2,
                flowType,
                examId: selectedExam.id,
                subjectId: selectedSubject.id,
                paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
                step: 'solving',
                questions,
                currentQuestionIndex,
                userAnswers,
                visitedQuestions,
                markedForReview,
                bookmarked,
                eliminated,
                notes,
                timer: timerRef.current,
                elapsedSeconds: elapsedRef.current,
                savedAt: Date.now(),
            });
        }, 5000);
        return () => window.clearInterval(handle);
    }, [
        step,
        flowType,
        selectedExam,
        selectedSubject,
        selectedPaper,
        questions,
        currentQuestionIndex,
        userAnswers,
        visitedQuestions,
        markedForReview,
        bookmarked,
        eliminated,
        notes,
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
            mode:
                flowType === 'weekly'
                    ? 'weekly'
                    : flowType === 'pyq'
                      ? 'pyq'
                      : flowType === 'mock'
                        ? 'mock'
                        : 'standard',
            score,
            total: questions.length,
            timeSeconds: elapsedSeconds || Math.max(0, (selectedExam.timeMinutes * 60) - timer),
            paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
        });
        // Keep the draft, flipped to `result`, so reloading the scorecard still
        // has the paper and answers needed to render the review.
        saveExamDraft({
            version: 2,
            flowType,
            examId: selectedExam.id,
            subjectId: selectedSubject.id,
            paperYear: selectedPaper ? String(selectedPaper.year) : undefined,
            step: 'result',
            questions,
            currentQuestionIndex,
            userAnswers,
            visitedQuestions,
            markedForReview,
            bookmarked,
            eliminated,
            notes,
            timer,
            elapsedSeconds,
            savedAt: Date.now(),
        });
    }, [
        step,
        selectedExam,
        selectedSubject,
        selectedPaper,
        questions,
        currentQuestionIndex,
        userAnswers,
        visitedQuestions,
        markedForReview,
        bookmarked,
        eliminated,
        notes,
        elapsedSeconds,
        timer,
        flowType,
        recordAttempt,
    ]);

    const resetExam = useCallback(() => {
        setQuestions([]);
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
        setReviewFilter('all');
        recordedRef.current = false;
        clearExamDraft(flowType);
    }, [flowType]);

    const exitToSelection = useCallback(() => {
        resetExam();
        weeklyAutoStartedRef.current = false;
        if (flowType === 'weekly') {
            updateFlowParams(
                {
                    weeklySession: null,
                    challenge: null,
                    step: null,
                    exam: null,
                    subject: null,
                    paper: null,
                },
                { replace: true },
            );
            return;
        }
        if (flowType === 'pyq' && selectedSubject) goToStep('paper', { paper: null });
        else if (selectedExam) goToStep('subject', { paper: null });
        else goToStep('exam');
    }, [flowType, goToStep, resetExam, selectedExam, selectedSubject, updateFlowParams]);

    const handleBack = () => {
        if (step === 'result') {
            exitToSelection();
        } else if (step === 'solving') {
            const confirmQuit = window.confirm('Leave this exam? Your answers for this attempt will be discarded.');
            if (confirmQuit) exitToSelection();
        } else if (step === 'paper') {
            if (flowType === 'weekly' && weeklySession?.subjectId) exitToSelection();
            else goToStep('subject', { paper: null });
        } else if (step === 'subject') {
            if (flowType === 'weekly' && weeklySession?.examId) exitToSelection();
            else goToStep('exam');
        }
    };

    const handleExamSelect = (exam: Exam) => {
        goToStep('subject', { exam: exam.id, subject: null, paper: null });
    };

    const resolveExamYear = (exam: Exam, paper: Paper | null | undefined) => {
        if (paper?.year != null) return String(paper.year);
        return String(exam.papers?.[0]?.year ?? new Date().getFullYear() - 1);
    };

    const applyQuestionsAndStartSolving = (
        finalQuestions: Question[],
        exam: Exam,
        subject: ExamSubject,
        paper: Paper | null,
    ) => {
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
        saveExamDraft({
            version: 2,
            flowType,
            examId: exam.id,
            subjectId: subject.id,
            paperYear: paper ? String(paper.year) : undefined,
            step: 'solving',
            questions: finalQuestions,
            currentQuestionIndex: 0,
            userAnswers: new Array(finalQuestions.length).fill(-1),
            visitedQuestions: initialVisited,
            markedForReview: new Array(finalQuestions.length).fill(false),
            bookmarked: new Array(finalQuestions.length).fill(false),
            eliminated: {},
            notes: {},
            timer: share,
            elapsedSeconds: 0,
            savedAt: Date.now(),
        });
        goToStep('solving', {
            exam: exam.id,
            subject: subject.id,
            paper: paper ? String(paper.year) : null,
        });
    };

    /** Full AI exam generation: syllabus-aligned, batched, fresh session each call. */
    const generateAndStartExam = async (exam: Exam, subject: ExamSubject, paperOverride?: Paper | null) => {
        if (flowType === 'weekly') {
            if (!weeklySession || !isSessionLive(weeklySession)) {
                window.alert('This weekly exam window has closed.');
                exitToSelection();
                return;
            }
        }
        const generationId = ++generationIdRef.current;
        setIsGenerating(true);
        try {
            const year = resolveExamYear(exam, paperOverride !== undefined ? paperOverride : selectedPaper);
            const count = mockFlow
                ? Math.min(subject.questionsCount, Math.max(15, Math.round(subject.questionsCount * 0.6)))
                : subject.questionsCount;
            const finalQuestions = await aiExamGenerator.generateAIExamPaper({
                examId: exam.id,
                examName: exam.name,
                subjectId: subject.id,
                subjectName: subject.name,
                count,
                examYear: year,
                mode: paperFlow ? 'pyq' : 'mock',
            });
            if (!isMountedRef.current || generationId !== generationIdRef.current) return;
            applyQuestionsAndStartSolving(
                finalQuestions,
                exam,
                subject,
                paperOverride !== undefined ? paperOverride : selectedPaper,
            );
        } catch (error) {
            console.error('Failed to generate exam questions:', error);
            if (isMountedRef.current && generationId === generationIdRef.current) {
                weeklyAutoStartedRef.current = false;
                toast.error('Could not generate the exam paper. Please try again.');
            }
        } finally {
            if (isMountedRef.current && generationId === generationIdRef.current) {
                setIsGenerating(false);
            }
        }
    };

    // Weekly mock deep-link: exam + subject preselected → generate immediately while live
    useEffect(() => {
        if (flowType !== 'weekly' || !weeklySession) return;
        if (!isSessionLive(weeklySession)) return;
        if (!mockFlow || !selectedExam || !selectedSubject) return;
        if (step !== 'subject' || questions.length > 0 || isGenerating) return;
        if (weeklyAutoStartedRef.current) return;
        weeklyAutoStartedRef.current = true;
        void generateAndStartExam(selectedExam, selectedSubject, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot deep-link start
    }, [
        flowType,
        weeklySession,
        mockFlow,
        selectedExam,
        selectedSubject,
        step,
        questions.length,
        isGenerating,
    ]);

    const handleSubjectSelect = async (subject: ExamSubject) => {
        if (!selectedExam) return;
        // Standard + weekly mock start immediately; PYQ / mock catalog still pick a year paper
        if (flowType === 'standard' || (flowType === 'weekly' && weeklySession?.mode === 'mock')) {
            updateFlowParams({ subject: subject.id, paper: null }, { replace: true });
            await generateAndStartExam(selectedExam, subject, null);
        } else {
            goToStep('paper', { subject: subject.id, paper: null });
        }
    };

    const handlePaperSelect = async (paper: Paper) => {
        updateFlowParams({ paper: String(paper.year) }, { replace: true });
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
            goToStep('result');
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
    const correctCount = calculateScore();
    const attemptedCount = userAnswers.filter((answer) => answer !== -1).length;
    const incorrectCount = Math.max(0, attemptedCount - correctCount);
    const unattemptedCount = Math.max(0, questions.length - attemptedCount);
    const accuracyPercent = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;
    const attemptPercent = questions.length
        ? Math.round((attemptedCount / questions.length) * 100)
        : 0;
    const rawScore = correctCount * 4 - incorrectCount;
    const maxScore = questions.length * 4;
    const timeTakenSeconds =
        elapsedSeconds || Math.max(0, (selectedExam?.timeMinutes || 0) * 60 - timer);
    const reviewItems = questions
        .map((question, index) => {
            const answer = userAnswers[index];
            const status: 'correct' | 'incorrect' | 'unattempted' =
                answer === -1
                    ? 'unattempted'
                    : answer === question.correctAnswer
                      ? 'correct'
                      : 'incorrect';
            return { question, index, status };
        })
        .filter((item) => reviewFilter === 'all' || item.status === reviewFilter);

    return (
        <div className={`relative w-full ${isDashboardView && step === 'solving' ? 'min-h-0' : ''}`}>
            <AnimatePresence mode="wait">
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
                    >
                        <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full animate-ping opacity-75" />
                            <div className="absolute inset-0 border-4 border-orange-600 dark:border-orange-400 rounded-full border-t-transparent animate-spin" />
                            <BrainCircuit className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-pulse" />
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
                            className="p-2 lg:p-3 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-2xl transition-all active:scale-95 flex items-center gap-2 group border border-slate-200 dark:border-slate-700 hover:border-orange-200 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Back to Exams</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 h-8 px-2 whitespace-nowrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'exam' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>Exams</span>
    
                        {selectedExam && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'subject' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedExam.name}</span>
                            </>
                        )}
    
                        {selectedSubject && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'paper' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedSubject.name}</span>
                            </>
                        )}
    
                        {selectedPaper && (
                            <>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'result' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedPaper.year}</span>
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
                            className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500"
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
                                {flowType === 'weekly'
                                    ? 'Weekly exam'
                                    : flowType === 'mock'
                                      ? 'Full-length mocks'
                                      : flowType === 'pyq'
                                        ? 'Previous year papers'
                                        : 'Available exams'}
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                {flowType === 'weekly'
                                    ? weeklySession?.title ||
                                      'Complete the published weekend assessment while the live window is open.'
                                    : flowType === 'mock'
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
                                    badge={
                                        flowType === 'weekly'
                                            ? 'Weekly'
                                            : flowType === 'mock'
                                              ? 'Mock'
                                              : flowType === 'pyq'
                                                ? 'PYQ'
                                                : undefined
                                    }
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
                            <span className="px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100 dark:border-orange-800/50">
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
                                    <PremiumSelectionCard
                                        key={subject.id}
                                        title={subject.name}
                                        eyebrow={`${selectedExam.name} domain`}
                                        description="Exam-pattern practice with adaptive difficulty and live performance tracking."
                                        meta={`${subject.questionsCount} practice questions`}
                                        icon={<BrainCircuit className="h-5 w-5" />}
                                        accent={theme.color}
                                        image={bgUrl}
                                        index={i}
                                        badge={
                                            flowType === 'weekly'
                                                ? 'Weekly'
                                                : flowType === 'mock'
                                                  ? 'Mock track'
                                                  : 'Subject'
                                        }
                                        onClick={() => handleSubjectSelect(subject)}
                                    />
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
                        <div className="comp-surface-card group relative mb-10 overflow-hidden p-6 sm:p-10">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-150" />
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

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedExam.papers.map((paper: Paper, i: number) => {
                                const theme = EXAM_THEMES[selectedExam?.id || 'gate'];
                                return (
                                    <PremiumSelectionCard
                                        key={`${paper.year}-${paper.shift || '1'}`}
                                        title={String(paper.year)}
                                        eyebrow="Previous year paper"
                                        description={`${selectedExam.name} official-pattern archive for timed simulation.`}
                                        meta={`Shift ${paper.shift || '1'} · ${selectedExam.timeMinutes} minutes`}
                                        icon={<Calendar className="h-5 w-5" />}
                                        accent={theme.color}
                                        index={i}
                                        compact
                                        badge="PYQ"
                                        onClick={() => handlePaperSelect(paper)}
                                    />
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
                            onSubmit={() => goToStep('result')}
                            onToggleEliminate={handleToggleEliminate}
                            onToggleBookmark={handleToggleBookmark}
                            onNoteChange={handleNoteChange}
                        />
                    </motion.div>
                )}

                {/* Step 6: Result Screen */}
                {step === 'result' && (
                    <div className="space-y-8 opacity-100 transition-all duration-500">
                        <section
                            className="exam-result-hero"
                            style={{ '--result-accent': activeTheme.color } as React.CSSProperties}
                        >
                            <div className="exam-result-hero__glow" />
                            <header className="exam-result-hero__header">
                                <div className="exam-result-hero__status">
                                    <span><Trophy className="h-4 w-4" /></span>
                                    <div>
                                        <p>Assessment completed</p>
                                        <h2>Performance report</h2>
                                    </div>
                                </div>
                                <div className="exam-result-hero__identity">
                                    <span>{selectedExam?.name || 'Session'}</span>
                                    <span>{selectedSubject?.name || 'Subject'}</span>
                                    {selectedPaper?.year && <span>{selectedPaper.year}</span>}
                                </div>
                            </header>

                            <div className="exam-result-hero__body">
                                <motion.div
                                    className="exam-score-dial"
                                    initial={{ opacity: 0, scale: 0.82 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                                    style={{
                                        background: `conic-gradient(${activeTheme.color} ${accuracyPercent * 3.6}deg, color-mix(in srgb, ${activeTheme.color} 10%, transparent) 0deg)`,
                                    }}
                                >
                                    <div className="exam-score-dial__inner">
                                        <span>Net score</span>
                                        <strong>{rawScore}</strong>
                                        <small>out of {maxScore}</small>
                                    </div>
                                </motion.div>

                                <div className="exam-result-summary">
                                    <p className="exam-result-summary__eyebrow">AIra assessment intelligence</p>
                                    <h3>
                                        {accuracyPercent >= 80
                                            ? 'Excellent command of this test.'
                                            : accuracyPercent >= 60
                                              ? 'Strong attempt with clear room to advance.'
                                              : 'A useful baseline for your next focused revision.'}
                                    </h3>
                                    <p className="exam-result-summary__copy">
                                        You attempted {attemptedCount} of {questions.length} questions with {accuracyPercent}% overall accuracy.
                                        Review the answer analysis below to strengthen weak concepts.
                                    </p>
                                    <div className="exam-result-breakdown">
                                        <div><span className="is-correct"><CheckCircle className="h-4 w-4" /></span><strong>{correctCount}</strong><small>Correct</small></div>
                                        <div><span className="is-wrong"><XCircle className="h-4 w-4" /></span><strong>{incorrectCount}</strong><small>Incorrect</small></div>
                                        <div><span className="is-skipped"><FileText className="h-4 w-4" /></span><strong>{unattemptedCount}</strong><small>Unattempted</small></div>
                                    </div>
                                </div>
                            </div>

                            <div className="exam-result-metrics">
                                <PremiumMetricCard
                                    icon={<Target className="h-5 w-5" />}
                                    value={`${accuracyPercent}%`}
                                    label="Overall accuracy"
                                    accent="#059669"
                                    detail={`${correctCount} correct answers`}
                                />
                                <PremiumMetricCard
                                    icon={<CheckCircle className="h-5 w-5" />}
                                    value={`${attemptPercent}%`}
                                    label="Attempt rate"
                                    accent={activeTheme.color}
                                    detail={`${attemptedCount} of ${questions.length} attempted`}
                                />
                                <PremiumMetricCard
                                    icon={<Clock className="h-5 w-5" />}
                                    value={formatTime(timeTakenSeconds)}
                                    label="Time invested"
                                    accent="#2563eb"
                                    detail={`${questions.length ? Math.round(timeTakenSeconds / questions.length) : 0}s average per question`}
                                />
                            </div>

                            <div className="exam-result-actions">
                                <button type="button" onClick={exitToSelection} className="exam-result-actions__secondary">
                                    <ArrowLeft className="h-4 w-4" /> Choose another test
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
                                                paperFlow ? selectedPaper : null
                                            );
                                        })();
                                    }}
                                    className="exam-result-actions__primary"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'Generating…' : 'Retake assessment'}
                                </button>
                            </div>
                        </section>

                        {/* Detailed Answer Sheet Section */}
                        <section className="answer-review-section">
                            <header className="answer-review-header">
                                <div className="answer-review-header__copy">
                                    <span><FileText className="h-5 w-5" /></span>
                                    <div>
                                        <p>Response analysis</p>
                                        <h3>Answer review</h3>
                                        <small>Compare every response and study the reasoning behind the correct answer.</small>
                                    </div>
                                </div>
                                <div className="answer-review-filters" role="tablist" aria-label="Filter reviewed answers">
                                    {([
                                        ['all', 'All', questions.length],
                                        ['correct', 'Correct', correctCount],
                                        ['incorrect', 'Incorrect', incorrectCount],
                                        ['unattempted', 'Skipped', unattemptedCount],
                                    ] as const).map(([value, label, count]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            role="tab"
                                            aria-selected={reviewFilter === value}
                                            onClick={() => setReviewFilter(value)}
                                            className={reviewFilter === value ? 'is-active' : ''}
                                        >
                                            <span>{label}</span>
                                            <strong>{count}</strong>
                                        </button>
                                    ))}
                                </div>
                            </header>

                            <AnimatePresence mode="popLayout">
                                <div className="answer-review-list">
                                    {reviewItems.map(({ question: q, index: idx, status }, position) => {
                                        const explanationSteps = (q.explanation || '')
                                            .split('\n')
                                            .map((item) => item.trim())
                                            .filter(Boolean);
                                        const stepsToRender = explanationSteps.length
                                            ? explanationSteps
                                            : ['Review the core concept and compare each option before selecting the final answer.'];
                                        const selectedAnswer = userAnswers[idx];

                                        return (
                                            <motion.article
                                                layout
                                                key={q.id}
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: Math.min(position * 0.045, 0.25), type: 'spring', damping: 24 }}
                                                className={`answer-review-card answer-review-card--${status}`}
                                            >
                                                <div className="answer-review-card__rail" />
                                                <header className="answer-review-card__header">
                                                    <div className="answer-review-card__labels">
                                                        <span className="answer-review-card__number">Question {idx + 1}</span>
                                                        <span className={`answer-review-card__status answer-review-card__status--${status}`}>
                                                            {status === 'correct' ? <CheckCircle className="h-3.5 w-3.5" /> : status === 'incorrect' ? <XCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                                            {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Unattempted'}
                                                        </span>
                                                        <span className="answer-review-card__difficulty">{q.difficulty}</span>
                                                    </div>
                                                    <span className="answer-review-card__marks">
                                                        {status === 'correct' ? '+4 marks' : status === 'incorrect' ? '−1 mark' : '0 marks'}
                                                    </span>
                                                </header>

                                                <div className="answer-review-card__question">
                                                    <p>{q.subjectName || selectedSubject?.name} · {q.topic}</p>
                                                    <h4>{q.text}</h4>
                                                </div>

                                                <div className="answer-comparison">
                                                    <div className={`answer-comparison__item answer-comparison__item--${status}`}>
                                                        <div className="answer-comparison__label">
                                                            <span>Your response</span>
                                                            <small>{status === 'correct' ? 'Matched' : status === 'incorrect' ? 'Needs review' : 'Not answered'}</small>
                                                        </div>
                                                        <div className="answer-comparison__answer">
                                                            <strong>{selectedAnswer !== -1 ? String.fromCharCode(65 + selectedAnswer) : '—'}</strong>
                                                            <span>{selectedAnswer !== -1 ? q.options[selectedAnswer] : 'No option selected'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="answer-comparison__item answer-comparison__item--solution">
                                                        <div className="answer-comparison__label">
                                                            <span>Correct answer</span>
                                                            <small>Verified solution</small>
                                                        </div>
                                                        <div className="answer-comparison__answer">
                                                            <strong>{String.fromCharCode(65 + q.correctAnswer)}</strong>
                                                            <span>{q.options[q.correctAnswer]}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="answer-explanation">
                                                    <header className="answer-explanation__header">
                                                        <span style={{ backgroundColor: activeTheme.color }}><Brain className="h-5 w-5" /></span>
                                                        <div>
                                                            <p style={{ color: activeTheme.color }}>Expert explanation</p>
                                                            <h5>Understand the reasoning</h5>
                                                        </div>
                                                        <span className="answer-explanation__step-count">{stepsToRender.length} steps</span>
                                                    </header>

                                                    <div className="answer-explanation__steps">
                                                        {stepsToRender.map((stepText, stepIndex) => (
                                                            <div key={`${q.id}-step-${stepIndex}`} className="answer-explanation__step">
                                                                <span style={{ color: activeTheme.color, borderColor: `${activeTheme.color}35` }}>
                                                                    {stepIndex + 1}
                                                                </span>
                                                                <p>{stepText}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <footer className="answer-explanation__footer">
                                                        <div>
                                                            <Sparkles className="h-4 w-4" style={{ color: activeTheme.color }} />
                                                            <span>Need a lecturer-style walkthrough?</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const { icon: _icon, ...serializableTheme } = activeTheme;
                                                                void _icon;
                                                                const payload = {
                                                                    competitiveQuestion: q,
                                                                    theme: serializableTheme,
                                                                    userAnswer: userAnswers[idx],
                                                                    examName: selectedExam?.name,
                                                                    returnTo: `${location.pathname}${location.search}`,
                                                                };
                                                                // Mirrored to session storage so reloading the
                                                                // explanation page keeps its question.
                                                                saveExplainPayload(payload);
                                                                navigate('/student/competitive-explain', { state: payload });
                                                            }}
                                                            style={{ backgroundColor: activeTheme.color }}
                                                        >
                                                            <Sparkles className="h-4 w-4" />
                                                            Explain with AI
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </footer>
                                                </div>
                                            </motion.article>
                                        );
                                    })}
                                </div>
                            </AnimatePresence>
                        </section>
                    </div>
                )}
            </div>

            {/* Diagnostic Helper (Removed from user view since fixed) */}
        </div>
    );
}
