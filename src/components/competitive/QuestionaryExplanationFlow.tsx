import { useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, BookOpen, BrainCircuit, Target, Sparkles } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { COMPETITIVE_EXAMS } from '../../data/mockData';
import { SYLLABUS_TOPICS, QUESTIONARY_BANK, Question, SyllabusTopic } from '../../data/competitiveQuestions';
import { EXAM_THEMES } from '../../data/examThemes';
import ExamCard from './ExamCard';
import { PremiumSelectionCard } from './CompetitiveCards';
import { findExam, findSubject, saveExplainPayload } from '../../lib/competitiveRoute';


type Step = 'exam' | 'subject' | 'topic' | 'questions';

function normalizeStep(value: string | null): Step {
    return value === 'subject' || value === 'topic' || value === 'questions' ? value : 'exam';
}

export default function QuestionaryExplanationFlow() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Every level of the drill-down is addressable, so refresh and the browser
    // back button behave the same as the in-page Back control.
    const step = normalizeStep(searchParams.get('step'));
    const selectedExam = useMemo(() => findExam(searchParams.get('exam')), [searchParams]);
    const selectedSubject = useMemo(
        () => findSubject(selectedExam, searchParams.get('subject')),
        [selectedExam, searchParams],
    );
    const selectedTopic = useMemo<SyllabusTopic | null>(() => {
        const topicId = searchParams.get('topic');
        if (!topicId || !selectedSubject) return null;
        return (
            (SYLLABUS_TOPICS[selectedSubject.id] || []).find((topic) => topic.id === topicId) ?? null
        );
    }, [selectedSubject, searchParams]);

    const goToStep = useCallback(
        (next: Step, updates: Record<string, string | null> = {}, options: { replace?: boolean } = {}) => {
            const base: Record<string, string | null> =
                next === 'exam'
                    ? { step: null, exam: null, subject: null, topic: null }
                    : { step: next };
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    Object.entries({ ...base, ...updates }).forEach(([key, value]) => {
                        if (value === null) params.delete(key);
                        else params.set(key, value);
                    });
                    return params;
                },
                { replace: options.replace ?? false },
            );
        },
        [setSearchParams],
    );

    // Repair links that point at a level whose parent selection is missing.
    useEffect(() => {
        if (step === 'subject' && !selectedExam) goToStep('exam', {}, { replace: true });
        else if (step === 'topic' && !selectedSubject) {
            goToStep(selectedExam ? 'subject' : 'exam', {}, { replace: true });
        } else if (step === 'questions' && !selectedTopic) {
            goToStep(selectedSubject ? 'topic' : 'exam', {}, { replace: true });
        }
    }, [step, selectedExam, selectedSubject, selectedTopic, goToStep]);

    const handleBack = () => {
        if (step === 'questions') goToStep('topic', { topic: null });
        else if (step === 'topic') goToStep('subject', { subject: null, topic: null });
        else if (step === 'subject') goToStep('exam');
    };

    return (
        <div className="w-full relative min-h-full">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 p-1 sm:p-1.5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-sm overflow-x-auto no-scrollbar">
                {(step !== 'exam') && (
                    <button
                        onClick={handleBack}
                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 flex items-center gap-1.5 sm:gap-2 group border border-transparent hover:border-black/5 dark:hover:border-white/5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-black dark:group-hover:text-white" />
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Back</span>
                    </button>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-1 sm:px-2 whitespace-nowrap">
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'exam' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>Exams</span>

                    {selectedExam && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'subject' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedExam.name}</span>
                        </>
                    )}

                    {selectedSubject && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'topic' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedSubject.name}</span>
                        </>
                    )}

                    {selectedTopic && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'questions' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{selectedTopic.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Title Block */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
                    <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 shrink-0" />
                    <span className="truncate">Questionary Explanation</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
                    Navigate your syllabus and have AI intelligently explain key model questions step-by-step.
                </p>
            </div>

            {/* Step 1: Exam Selection */}
            {step === 'exam' && (
                <motion.div
                    key="exam"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
                >
                    {COMPETITIVE_EXAMS.map((exam, i) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            index={i}
                            badge="AI Lecture"
                            onSelect={(nextExam) => goToStep('subject', { exam: nextExam.id, subject: null, topic: null })}
                        />
                    ))}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
                                'intel': 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=800&auto=format&fit=crop', 
                                'gk': 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=800&auto=format&fit=crop', 
                                'arith': 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?q=80&w=800&auto=format&fit=crop', 
                                'hin': 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=800&auto=format&fit=crop', 
                                'sst': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop', 
                                'lang': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop', 
                                'default': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'
                            };
                            const bgUrl = SUBJECT_IMAGES[subject.id.trim().toLowerCase()] || SUBJECT_IMAGES[subject.name.trim().toLowerCase()] || SUBJECT_IMAGES['default'];

                            return (
                                <PremiumSelectionCard
                                    key={subject.id}
                                    title={subject.name}
                                    eyebrow={`${selectedExam.name} subject`}
                                    description="Explore syllabus topics and open question-specific AI lectures."
                                    meta={`${subject.questionsCount} exam-pattern questions`}
                                    icon={<BookOpen className="h-5 w-5" />}
                                    accent={theme.color}
                                    image={bgUrl}
                                    index={i}
                                    compact
                                    badge="Explain"
                                    onClick={() => goToStep('topic', { subject: subject.id, topic: null })}
                                />
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Step 3: Topic Selection */}
            {step === 'topic' && selectedExam && selectedSubject && (
                <motion.div
                    key="topic"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                >
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
                                {selectedSubject.name} Syllabus
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Select a core topic to see available model questions.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                        {(SYLLABUS_TOPICS[selectedSubject.id] || SYLLABUS_TOPICS['default']).map((topic, i) => {
                            const theme = EXAM_THEMES[selectedExam.id] || EXAM_THEMES['gate'];
                            const availableQuestionsCount = QUESTIONARY_BANK[topic.id]?.length || 0;

                            return (
                                <PremiumSelectionCard
                                    key={topic.id}
                                    title={topic.name}
                                    eyebrow="Syllabus module"
                                    description="Review model questions with option analysis, shortcuts, and lecturer guidance."
                                    meta={`${availableQuestionsCount} model ${availableQuestionsCount === 1 ? 'question' : 'questions'}`}
                                    icon={<Target className="h-5 w-5" />}
                                    accent={theme.color}
                                    index={i}
                                    compact
                                    onClick={() => goToStep('questions', { topic: topic.id })}
                                />
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Step 4: Questions & AI Explanation List */}
            {step === 'questions' && selectedTopic && selectedExam && (
                 <motion.div
                 key="questions"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -30 }}
             >
                 <div className="mb-8">
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
                         {selectedTopic.name} Practice
                     </h2>
                     <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Explore model questions and learn the underlying concepts with our AI Teacher.</p>
                 </div>

                 <div className="space-y-8">
                     {(QUESTIONARY_BANK[selectedTopic.id] || QUESTIONARY_BANK['phy-mech']).map((q: Question, idx: number) => {
                         const theme = EXAM_THEMES[selectedExam.id] || EXAM_THEMES['gate'];

                         return (
                             <motion.div
                                 key={q.id}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.1, type: "spring", damping: 25 }}
                                 className="comp-surface-card group relative overflow-hidden p-5 transition-all hover:border-orange-500/30 sm:p-10 dark:hover:border-orange-400/30"
                             >
                                 {/* Hover Glow */}
                                 <div 
                                     className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -mr-48 -mt-48 transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
                                 />

                                 <div className="relative z-10">
                                     <div className="flex items-center gap-3 mb-6">
                                         <span className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                             Question {idx + 1}
                                         </span>
                                         <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                             {q.difficulty} Level
                                         </span>
                                         <span className="hidden xs:inline-block px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ml-auto border border-slate-200 dark:border-slate-700 text-slate-400">
                                             {selectedExam.name} Pattern
                                         </span>
                                     </div>

                                     <h4 className="font-bold text-xl sm:text-2xl md:text-3xl text-gray-900 dark:text-slate-100 leading-[1.4] tracking-tight mb-8 break-words">
                                         {q.text}
                                     </h4>

                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                         {q.options.map((opt, oIdx) => (
                                             <div key={oIdx} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                 <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex flex-shrink-0 items-center justify-center text-sm font-black text-slate-500">
                                                     {String.fromCharCode(65 + oIdx)}
                                                 </div>
                                                 <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                                                     {opt}
                                                 </span>
                                             </div>
                                         ))}
                                     </div>
                                     
                                     {/* Explain with AI Action Bar */}
                                     <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
                                         <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium text-center md:text-left">
                                             <BrainCircuit className="w-5 h-5 text-orange-500/70 shrink-0 hidden sm:block" />
                                             <span>Stuck on the underlying logic? Let AI explain it.</span>
                                         </div>
                                         
                                         <button
                                             type="button"
                                             onClick={(e) => {
                                                 e.preventDefault();
                                                 // MUST strip the non-serializable React Node (icon) to prevent DataCloneError
                                                 const { icon: _icon, ...serializableTheme } = theme;
                                                 void _icon;
                                                 const payload = {
                                                     competitiveQuestion: q,
                                                     theme: serializableTheme,
                                                     userAnswer: -1,
                                                     examName: selectedExam?.name,
                                                     returnTo: `${location.pathname}${location.search}`,
                                                 };
                                                 saveExplainPayload(payload);
                                                 navigate('/student/competitive-explain', {
                                                     state: payload 
                                                 });
                                             }}
                                             className="w-full md:w-auto group flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-white font-bold relative overflow-hidden shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                             style={{ 
                                                 background: `linear-gradient(135deg, ${theme.color}, ${theme.color}ee)`,
                                                 boxShadow: `0 10px 25px -5px ${theme.color}40`
                                             }}
                                         >
                                             {/* Sparkle shine effect */}
                                             <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                             
                                             <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 drop-shadow-sm" />
                                             <span className="relative z-10 tracking-wide text-xs sm:text-[14px]">Explain with AI Teacher</span>
                                             <ChevronRight className="w-4 h-4 relative z-10 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                         </button>
                                     </div>

                                 </div>
                             </motion.div>
                         );
                     })}
                 </div>
             </motion.div>
            )}

        </div>
    );
}
