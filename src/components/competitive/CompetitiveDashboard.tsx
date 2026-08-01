import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    BrainCircuit,
    Sparkles,
} from 'lucide-react';
import ExamFlow from './ExamFlow';
import TopicQuizzesFlow from './TopicQuizzesFlow';
import QuestionaryExplanationFlow from './QuestionaryExplanationFlow';
import PerformanceAnalytics from './PerformanceAnalytics';
import WeeklyTestsFlow from './WeeklyTestsFlow';
import { FLOW_PARAMS, SECTION_PARAM, normalizeSection } from '../../lib/competitiveRoute';

const SIDEBAR_ITEMS = [
    { id: 'exams', label: 'Available Exams', icon: LayoutDashboard, hint: 'Catalog' },
    { id: 'weekly', label: 'Weekly Tests', icon: Calendar, hint: 'Rhythm' },
    { id: 'quizzes', label: 'Topic Quizzes', icon: BookOpen, hint: 'Drill' },
    { id: 'questionary', label: 'AI Explanation', icon: BrainCircuit, hint: 'Lecture' },
    { id: 'pyqs', label: 'Previous Years', icon: Clock, hint: 'PYQ' },
    { id: 'mock', label: 'Mock Tests', icon: Target, hint: 'Simulate' },
    { id: 'performance', label: 'Analytics', icon: BarChart2, hint: 'Insights' },
] as const;

export default function CompetitiveDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExamActive, setIsExamActive] = useState(false);

    // The active section lives in the URL so refresh, deep links and the browser
    // back button all resolve to the screen the student was actually on.
    const activeSection = normalizeSection(searchParams.get(SECTION_PARAM));

    // Normalise an unknown or missing `section` without adding a history entry.
    useEffect(() => {
        const raw = searchParams.get(SECTION_PARAM);
        if (raw === activeSection) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set(SECTION_PARAM, activeSection);
                return next;
            },
            { replace: true },
        );
    }, [activeSection, searchParams, setSearchParams]);

    const selectSection = useCallback(
        (sectionId: (typeof SIDEBAR_ITEMS)[number]['id']) => {
            setIsMobileMenuOpen(false);
            if (sectionId === activeSection) return;
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set(SECTION_PARAM, sectionId);
                // Flow params belong to the section being left behind.
                FLOW_PARAMS.forEach((param) => next.delete(param));
                return next;
            });
        },
        [activeSection, setSearchParams],
    );

    const active = SIDEBAR_ITEMS.find((i) => i.id === activeSection) || SIDEBAR_ITEMS[0];
    const ActiveIcon = active.icon;

    return (
        <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-3 py-4 sm:gap-6 sm:px-5 lg:flex-row lg:px-8 lg:py-6">
            {/* Mobile section switcher */}
            <div
                className={`flex items-center justify-between rounded-2xl border border-[var(--comp-border)] bg-[var(--comp-elevated)]/90 p-3.5 shadow-sm backdrop-blur-xl lg:hidden ${
                    isExamActive ? 'hidden' : ''
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <ActiveIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            {active.hint}
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{active.label}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((v) => !v)}
                    className="rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    aria-label="Toggle navigation"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`
                absolute inset-x-3 top-[4.5rem] z-40 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-3xl
                border border-[var(--comp-border)] bg-[var(--comp-elevated)]/95 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl
                transition-all duration-400 lg:relative lg:inset-auto lg:top-0 lg:z-auto lg:max-h-none
                lg:w-[280px] lg:shrink-0 xl:w-[300px]
                ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100'}
                ${isExamActive ? '!hidden' : ''}
            `}
            >
                <div className="relative flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                    <div className="mb-5 flex items-center gap-2 px-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            Competitive hub
                        </span>
                    </div>
                    <nav className="space-y-1.5">
                        {SIDEBAR_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectSection(item.id)}
                                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3.5 transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent font-bold text-orange-800 shadow-sm dark:text-orange-200'
                                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/70'
                                    }`}
                                >
                                    {isActive && (
                                        <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-orange-500" />
                                    )}
                                    <span
                                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                            isActive
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                                : 'bg-slate-100 text-slate-500 group-hover:text-orange-600 dark:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="relative z-10 flex-1 text-left text-sm tracking-wide">
                                        {item.label}
                                    </span>
                                    {isActive && <ChevronRight className="relative z-10 h-4 w-4 opacity-50" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main */}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28 }}
                        className="min-h-full"
                    >
                        {activeSection === 'exams' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="standard" />
                        )}
                        {activeSection === 'pyqs' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="pyq" />
                        )}
                        {activeSection === 'mock' && (
                            <ExamFlow onExamStateChange={setIsExamActive} isDashboardView flowType="mock" />
                        )}
                        {activeSection === 'weekly' && (
                            <WeeklyTestsFlow onExamStateChange={setIsExamActive} />
                        )}
                        {activeSection === 'quizzes' && <TopicQuizzesFlow />}
                        {activeSection === 'questionary' && <QuestionaryExplanationFlow />}
                        {activeSection === 'performance' && <PerformanceAnalytics />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
