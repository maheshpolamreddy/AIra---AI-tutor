import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Calendar, 
    BookOpen, 
    Clock, 
    Target, 
    BarChart2, 
    Menu, 
    X,
    ChevronRight,
    BrainCircuit
} from 'lucide-react';
import ExamFlow from './ExamFlow';
import TopicQuizzesFlow from './TopicQuizzesFlow';
import QuestionaryExplanationFlow from './QuestionaryExplanationFlow';

const SIDEBAR_ITEMS = [
    { id: 'exams', label: 'Available Exams', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'weekly', label: 'Weekly Tests', icon: <Calendar className="w-5 h-5" /> },
    { id: 'quizzes', label: 'Topic-wise Quizzes', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'questionary', label: 'Questionary Explanation', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'pyqs', label: 'Previous Year Papers', icon: <Clock className="w-5 h-5" /> },
    { id: 'mock', label: 'Mock Tests', icon: <Target className="w-5 h-5" /> },
    { id: 'performance', label: 'Performance Analysis', icon: <BarChart2 className="w-5 h-5" /> },
];

export default function CompetitiveDashboard() {
    const [activeSection, setActiveSection] = useState('exams');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExamActive, setIsExamActive] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
            
            {/* Mobile Sidebar Toggle */}
            <div className={`lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 ${isExamActive ? 'hidden' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
                    </span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-gray-600 dark:text-slate-300"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <div className={`
                absolute lg:relative top-[72px] lg:top-0 left-4 right-4 lg:left-0 lg:right-0 bottom-4 lg:bottom-0 z-40 lg:z-auto
                w-auto lg:w-[280px] xl:w-[320px] shrink-0
                bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2rem] lg:rounded-[2.5rem] 
                border border-white/60 dark:border-slate-700/50
                shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]
                flex flex-col overflow-hidden transition-all duration-500
                ${isMobileMenuOpen ? 'translate-y-0 opacity-100 flex' : '-translate-y-8 opacity-0 hidden lg:flex lg:translate-y-0 lg:opacity-100'}
                ${isExamActive ? '!hidden' : ''}
            `}>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border border-white/40 dark:border-slate-700/50 p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 min-h-min flex flex-col relative overflow-hidden flex-1 overflow-y-auto hide-scrollbar">
                    {/* Subtle internal glow for the sidebar */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="mb-6 px-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500">Dashboard Panel</span>
                    </div>
                    <nav className="space-y-2">
                        {SIDEBAR_ITEMS.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSection(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative overflow-hidden ${
                                        isActive 
                                            ? 'text-indigo-700 dark:text-indigo-300 font-bold shadow-md shadow-indigo-500/10' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80'
                                    }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl" />
                                    )}
                                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="flex-1 text-left text-sm tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 opacity-50" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full min-w-0 h-full overflow-y-auto hide-scrollbar pb-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="min-h-full"
                    >
                        {activeSection === 'exams' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView={true} flowType="standard" />
                        )}

                        {activeSection === 'pyqs' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView={true} flowType="pyq" />
                        )}

                        {activeSection === 'mock' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView={true} flowType="standard" />
                        )}

                        {activeSection === 'quizzes' && (
                            <TopicQuizzesFlow />
                        )}

                        {activeSection === 'questionary' && (
                            <QuestionaryExplanationFlow />
                        )}
                        
                        {(activeSection !== 'exams' && activeSection !== 'pyqs' && activeSection !== 'quizzes' && activeSection !== 'questionary' && activeSection !== 'mock') && (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-[3rem] border border-slate-200/60 dark:border-slate-700/50 p-10 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:opacity-100 opacity-50 transition-opacity duration-700 pointer-events-none" />
                                
                                <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-800 shadow-xl shadow-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-8 transform group-hover:-translate-y-2 group-hover:rotate-3 transition-all duration-500 relative z-10">
                                    {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon}
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight relative z-10">
                                    {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium relative z-10">
                                    This premium section is currently under development. Stay tuned for highly anticipated feature rollouts.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    );
}
