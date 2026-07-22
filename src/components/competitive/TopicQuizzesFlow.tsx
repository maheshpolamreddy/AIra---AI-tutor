import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, FileText, ArrowLeft, Award, BrainCircuit, Clock } from 'lucide-react';
import { schoolGrades } from '../../data/schoolCurriculum';
import type { SchoolSubject, Chapter } from '../../types';
import { Question } from '../../data/competitiveQuestions';
import { aiExamGenerator } from '../../services/aiExamGenerator';


export default function TopicQuizzesFlow() {
    const [step, setStep] = useState<'subject' | 'chapter' | 'solving' | 'result'>('subject');
    
    // Defaulting to Class 12 Science for Competitive Topic Quizzes
    const defaultGrade = schoolGrades.find(g => g.id === 'grade-12-science') || schoolGrades[0];
    const [selectedSubject, setSelectedSubject] = useState<SchoolSubject | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'solving') {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleBack = () => {
        if (step === 'result') {
            setStep('chapter');
        } else if (step === 'solving') {
            const confirmQuit = window.confirm("Are you sure you want to quit the quiz? Progress will be lost.");
            if (confirmQuit) setStep('chapter');
        } else if (step === 'chapter') {
            setStep('subject');
        }
    };

    const handleSubjectSelect = (subject: SchoolSubject) => {
        setSelectedSubject(subject);
        setStep('chapter');
    };

    const handleChapterSelect = async (chapter: Chapter) => {
        setSelectedChapter(chapter);
        
        if (selectedSubject) {
            setIsGenerating(true);
            try {
                // Generate exactly 10 questions for this specific chapter using AI
                const generatedQuiz = await aiExamGenerator.generateAITopicQuiz(
                    selectedSubject.name,
                    chapter.name,
                    10
                );

                setQuestions(generatedQuiz);
                setUserAnswers(new Array(generatedQuiz.length).fill(-1));
                setCurrentQuestionIndex(0);
                setShowExplanation(false);
                setTimer(0);
                setStep('solving');
            } catch (error) {
                console.error("Failed to generate topic quiz:", error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showExplanation) return;
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const calculateScore = () => {
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        
        userAnswers.forEach((answer, index) => {
            if (answer === -1) unattempted++;
            else if (answer === questions[index].correctAnswer) correct++;
            else incorrect++;
        });

        // +4 for correct, -1 for incorrect
        return { correct, incorrect, unattempted, total: (correct * 4) - incorrect };
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                
                {/* AI Generating State Overlay */}
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
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Generating AI Topic Quiz...</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 max-w-sm text-center">
                            Crafting high-quality, perfectly aligned practice questions for {selectedChapter?.name}.
                        </p>
                    </motion.div>
                )}

                {/* Step 1: Subject Selection */}
                {step === 'subject' && (
                    <motion.div
                        key="subject"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="pb-10"
                    >
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Topic-wise Quizzes</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Select a core subject from the Class 11/12 Science curriculum to practice specific chapters.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                            {defaultGrade.subjects.map((subject, i) => {
                                // High-quality educational images tailored for each core subject
                                const SUBJECT_IMAGES: Record<string, string> = {
                                    'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
                                    'chemistry': '/images/subjects/chemistry.png',
                                    'mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
                                    'biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop',
                                    'english': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
                                    'computer science': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
                                    'science': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
                                    'social science': 'https://images.unsplash.com/photo-1447069387366-2a3b0638ca3d?q=80&w=800&auto=format&fit=crop',
                                    'hindi': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
                                    'default': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop'
                                };
                                
                                const bgUrl = SUBJECT_IMAGES[subject.name.trim().toLowerCase()] || SUBJECT_IMAGES[subject.id.trim().toLowerCase()] || SUBJECT_IMAGES['default'];

                                return (
                                    <motion.button
                                        key={subject.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
                                        onClick={() => handleSubjectSelect(subject)}
                                        className="w-full relative overflow-hidden group rounded-[2rem] bg-white dark:bg-slate-900 border-2 text-left transition-all duration-500 shadow-sm hover:shadow-2xl flex flex-col min-h-[200px]"
                                        style={{ borderColor: 'transparent' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `${subject.color}40`;
                                            e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = `0 25px 50px -12px ${subject.color}30`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                        }}
                                    >
                                        {/* Background Image with optimized overlay */}
                                        <div className="absolute inset-0 w-full h-full">
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                                style={{ backgroundImage: `url(${bgUrl})` }}
                                            />
                                            <div 
                                                className="absolute inset-0 opacity-60 dark:opacity-80 transition-all duration-500 group-hover:opacity-40"
                                                style={{ 
                                                    background: `linear-gradient(135deg, white 0%, rgba(255,255,255,0.8) 50%, transparent 100%)` 
                                                }}
                                            />
                                            {/* Dark mode adjustment for gradient */}
                                            <div className="absolute inset-0 opacity-0 dark:opacity-80 hidden dark:block transition-all duration-500 group-hover:opacity-60"
                                                 style={{ 
                                                     background: `linear-gradient(135deg, #0f172a 0%, rgba(15,23,42,0.8) 50%, transparent 100%)` 
                                                 }} />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col h-full p-6 w-full">
                                            <div className="flex items-center justify-between mb-auto">
                                                <div
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-rotate-6 transition-all duration-500 bg-white dark:bg-slate-800`}
                                                    style={{ color: subject.color }}
                                                >
                                                    <BrainCircuit className="w-6 h-6" />
                                                </div>
                                                <div className="w-9 h-9 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center group-hover:bg-white dark:group-hover:bg-indigo-500 transition-all shadow-sm group-hover:scale-110">
                                                    <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors`} />
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight mb-2 group-hover:translate-x-1 transition-transform">
                                                    {subject.name}
                                                </h3>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 w-fit group-hover:translate-x-1 transition-all">
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                        {subject.chapters.length} Topics
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Chapter Selection */}
                {step === 'chapter' && selectedSubject && (
                    <motion.div
                        key="chapter"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handleBack}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{selectedSubject.name} Quizzes</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Select a chapter to start a rapid 10-question practice test.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedSubject.chapters.map((chapter, i) => (
                                <motion.button
                                    key={chapter.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleChapterSelect(chapter)}
                                    className="w-full relative flex items-center p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all group overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4 shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                            {chapter.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Ch {chapter.chapterNumber}</span>
                                            <span>•</span>
                                            <span>10 Questions</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Solving Quiz (Simplified Exam Interface) */}
                {step === 'solving' && selectedChapter && questions.length > 0 && (
                    <motion.div
                        key="solving"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-[450px] sm:min-h-[600px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button onClick={handleBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{selectedChapter.name}</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500">Question {currentQuestionIndex + 1} of 10</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800 flex-shrink-0">
                                <Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
                                <span className="text-xs sm:text-sm">{formatTime(timer)}</span>
                            </div>
                        </div>

                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
                            <motion.div className="h-full bg-indigo-500" animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 md:p-10 overflow-y-auto">
                            <div className="mb-8">
                                <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 mb-4 tracking-wider uppercase">
                                    {questions[currentQuestionIndex].difficulty}
                                </div>
                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed break-words">
                                    {questions[currentQuestionIndex].text}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {questions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = userAnswers[currentQuestionIndex] === idx;
                                    const isCorrect = showExplanation && idx === questions[currentQuestionIndex].correctAnswer;
                                    const isWrong = showExplanation && isSelected && !isCorrect;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSelect(idx)}
                                            disabled={showExplanation}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4
                                                ${isSelected && !showExplanation ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 shadow-sm' : ''}
                                                ${!isSelected && !showExplanation ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
                                                ${isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 text-green-900 dark:text-green-100' : ''}
                                                ${isWrong ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : ''}
                                                ${showExplanation && !isCorrect && !isWrong ? 'border-slate-200 dark:border-slate-800 opacity-50' : ''}
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                                                ${isSelected && !showExplanation ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                                                ${isCorrect ? 'bg-green-500 text-white' : ''}
                                                ${isWrong ? 'bg-red-500 text-white' : ''}
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="font-medium text-sm md:text-base break-words">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl"
                                >
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Explanation
                                    </h4>
                                    <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed break-words">
                                        {questions[currentQuestionIndex].explanation}
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                            >
                                Previous
                            </button>
                            
                            {!showExplanation ? (
                                <button
                                    onClick={() => setShowExplanation(true)}
                                    disabled={userAnswers[currentQuestionIndex] === -1}
                                    className="px-5 py-2 rounded-xl font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 disabled:opacity-50 transition-colors text-sm"
                                >
                                    Check
                                </button>
                            ) : currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={() => setStep('result')}
                                    className="px-6 py-2 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-md transition-colors text-sm"
                                >
                                    Finish
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowExplanation(false);
                                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                                    }}
                                    className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2 text-sm"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Result */}
                {step === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl mx-auto text-center py-8 sm:py-12 px-4"
                    >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-slate-900 shadow-xl">
                            <Award className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 sm:mb-10">You've finished the {selectedChapter?.name} practice quiz.</p>

                        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 mb-10">
                            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{calculateScore().correct}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Correct</div>
                            </div>
                            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-2xl sm:text-3xl font-black text-red-500 dark:text-red-400 mb-1">{calculateScore().incorrect}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incorrect</div>
                            </div>
                            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">{calculateScore().total}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setStep('chapter');
                                resetQuizState();
                            }}
                            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            Take Another Quiz
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    function resetQuizState() {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setShowExplanation(false);
        setTimer(0);
    }
}
