import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, BookOpen, BrainCircuit, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMPETITIVE_EXAMS, Exam, ExamSubject } from '../../data/mockData';
import { SYLLABUS_TOPICS, QUESTIONARY_BANK, Question, SyllabusTopic } from '../../data/competitiveQuestions';
import { EXAM_THEMES, EXAM_IMAGES } from '../../data/examThemes';


type Step = 'exam' | 'subject' | 'topic' | 'questions';

export default function QuestionaryExplanationFlow() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('exam');
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<SyllabusTopic | null>(null);

    const handleBack = () => {
        if (step === 'questions') setStep('topic');
        else if (step === 'topic') setStep('subject');
        else if (step === 'subject') setStep('exam');
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
                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'exam' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>Exams</span>

                    {selectedExam && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'subject' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedExam.name}</span>
                        </>
                    )}

                    {selectedSubject && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'topic' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedSubject.name}</span>
                        </>
                    )}

                    {selectedTopic && (
                        <>
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
                            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${step === 'questions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{selectedTopic.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Title Block */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
                    <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 shrink-0" />
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
                    {COMPETITIVE_EXAMS.map((exam, i) => {
                        const theme = EXAM_THEMES[exam.id] || EXAM_THEMES['gate'];
                        const bgImageUrl = EXAM_IMAGES[exam.id] || EXAM_IMAGES['gate'];

                        return (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                                className="h-full"
                            >
                                <button
                                    onClick={() => { setSelectedExam(exam); setStep('subject'); }}
                                    className="w-full h-full relative overflow-hidden group rounded-[2.5rem] bg-white dark:bg-slate-900 text-left transition-all duration-500 shadow-lg hover:shadow-2xl flex flex-col min-h-[280px] sm:min-h-[320px] border-4 border-transparent"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = `${theme.color}30`;
                                        e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    }}
                                >
                                    {/* Background Image Layer */}
                                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                            style={{ backgroundImage: `url(${bgImageUrl})` }}
                                        />
                                        <div 
                                            className="absolute inset-0 opacity-60 dark:opacity-80 transition-all duration-500 group-hover:opacity-40"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${theme.color}aa 0%, ${theme.color}77 40%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)` 
                                            }}
                                        />
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="relative z-10 p-8 flex flex-col h-full w-full justify-between flex-1">
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                                                style={{ 
                                                    background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                                                    boxShadow: `0 10px 20px -5px ${theme.color}50`
                                                }}
                                            >
                                                {React.cloneElement(theme.icon as React.ReactElement, { className: 'w-10 h-10' })}
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest">
                                                Explanation
                                            </div>
                                        </div>

                                        <div className="mt-12">
                                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                                                {exam.name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-white/90">
                                                <span className="text-xs font-bold flex items-center gap-1.5">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {exam.subjects.length} Core Subjects
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}
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
                                <motion.div
                                    key={subject.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                                >
                                    <button
                                        onClick={() => { setSelectedSubject(subject); setStep('topic'); }}
                                        className="w-full relative overflow-hidden group rounded-[1.5rem] bg-white dark:bg-slate-900 border text-left transition-all duration-500 shadow-sm hover:shadow-xl flex flex-col min-h-[160px]"
                                        style={{
                                            borderColor: 'transparent',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = `0 15px 30px -10px ${theme.color}40`;
                                            e.currentTarget.style.borderColor = `${theme.color}40`;
                                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.05)`;
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        }}
                                    >
                                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                                style={{ backgroundImage: `url(${bgUrl})` }}
                                            />
                                            <div 
                                                className="absolute inset-0 opacity-90 dark:opacity-95 transition-opacity duration-500 group-hover:opacity-85"
                                                style={{ 
                                                    background: `linear-gradient(120deg, ${theme.bgColor.replace('0.15', '0.96')} 0%, ${theme.bgColor.replace('0.15', '0.8')} 60%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)` 
                                                }}
                                            />
                                        </div>

                                        <div className="relative z-10 flex flex-col h-full p-5 w-full">
                                            <div className="flex items-center justify-between mb-auto">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md`}
                                                    style={{ color: theme.color }}
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white transition-colors shadow-sm transform group-hover:translate-x-1">
                                                    <ChevronRight className="w-4 h-4 text-white group-hover:text-gray-900 transition-colors" />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <h3 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-md">
                                                    {subject.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
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
                                <motion.button
                                    key={topic.id}
                                    onClick={() => { setSelectedTopic(topic); setStep('questions'); }}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 text-left hover:shadow-xl transition-all duration-300 group flex items-start gap-5 relative overflow-hidden"
                                >
                                    {/* Hover gradient effect */}
                                    <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none"
                                        style={{ backgroundColor: theme.color }}
                                    />
                                    
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 shadow-sm transition-transform duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: theme.bgColor, color: theme.color }}
                                    >
                                        <BookOpen className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text transition-colors duration-300 line-clamp-2"
                                            style={{ backgroundImage: `linear-gradient(to right, ${theme.color}, ${theme.color})`, WebkitBackgroundClip: 'text' }}
                                        >
                                            {topic.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-auto">
                                            <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors group-hover:bg-white dark:group-hover:bg-slate-700">
                                                <Target className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 uppercase tracking-wider">
                                                    {availableQuestionsCount} Model {availableQuestionsCount === 1 ? 'Q' : 'Q\'s'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </motion.button>
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
                                 className="group p-5 sm:p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-400/30 relative overflow-hidden"
                             >
                                 {/* Hover Glow */}
                                 <div 
                                     className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mt-48 transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
                                 />

                                 <div className="relative z-10">
                                     <div className="flex items-center gap-3 mb-6">
                                         <span className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
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
                                             <BrainCircuit className="w-5 h-5 text-indigo-500/70 shrink-0 hidden sm:block" />
                                             <span>Stuck on the underlying logic? Let AI explain it.</span>
                                         </div>
                                         
                                         <button
                                             type="button"
                                             onClick={(e) => {
                                                 e.preventDefault();
                                                 // MUST strip the non-serializable React Node (icon) to prevent DataCloneError
                                                 const { icon: _icon, ...serializableTheme } = theme;
                                                 void _icon;
                                                 navigate('/student/competitive-explain', { 
                                                     state: { 
                                                         competitiveQuestion: q, 
                                                         theme: serializableTheme,
                                                         userAnswer: -1,
                                                         examName: selectedExam?.name
                                                     } 
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
