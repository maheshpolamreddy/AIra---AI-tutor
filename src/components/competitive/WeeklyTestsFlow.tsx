import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Flame, Play, Sparkles } from 'lucide-react';
import { COMPETITIVE_EXAMS } from '../../data/mockData';
import { EXAM_THEMES } from '../../data/examThemes';
import ExamFlow from './ExamFlow';

const WEEKLY_CHALLENGES = [
    {
        id: 'speed-sprint',
        title: 'Speed Sprint',
        blurb: '20 mixed questions · focus on sub-90s solves',
        examId: 'jee-main',
        badge: 'This week',
    },
    {
        id: 'accuracy-lab',
        title: 'Accuracy Lab',
        blurb: 'Hard-only set · negative marking active',
        examId: 'neet',
        badge: 'High yield',
    },
    {
        id: 'pyq-weekend',
        title: 'Weekend PYQ Block',
        blurb: 'Previous-year pattern drill for one subject',
        examId: 'eamcet',
        badge: 'Weekend',
    },
];

interface WeeklyTestsFlowProps {
    onExamStateChange?: (active: boolean) => void;
}

export default function WeeklyTestsFlow({ onExamStateChange }: WeeklyTestsFlowProps) {
    const [launching, setLaunching] = useState(false);
    const weekLabel = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }, []);

    if (launching) {
        return (
            <ExamFlow
                isDashboardView
                onExamStateChange={onExamStateChange}
                flowType="mock"
            />
        );
    }

    return (
        <div className="space-y-8">
            <header className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 sm:p-8 dark:border-amber-900/30 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/20">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                            <CalendarDays className="h-3.5 w-3.5" /> Week of {weekLabel}
                        </p>
                        <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Weekly assessments
                        </h2>
                        <p className="mt-2 max-w-lg text-sm font-medium text-slate-600 dark:text-slate-300">
                            Curated challenges that rotate each week — build rhythm without burning out.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                        <Flame className="h-8 w-8 text-orange-500" />
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Streak goal
                            </div>
                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                3 sessions / week
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {WEEKLY_CHALLENGES.map((challenge, i) => {
                    const exam = COMPETITIVE_EXAMS.find((e) => e.id === challenge.examId);
                    const theme = EXAM_THEMES[challenge.examId] || EXAM_THEMES.gate;
                    return (
                        <motion.article
                            key={challenge.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="group flex flex-col rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/40 dark:border-slate-700/50 dark:bg-slate-900 dark:shadow-black/20"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <span
                                    className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white"
                                    style={{ backgroundColor: theme.color }}
                                >
                                    {challenge.badge}
                                </span>
                                <Sparkles className="h-4 w-4 text-slate-300 transition group-hover:text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                {challenge.title}
                            </h3>
                            <p className="mt-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
                                {challenge.blurb}
                            </p>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Anchored to {exam?.name || challenge.examId}
                            </p>
                            <button
                                type="button"
                                onClick={() => setLaunching(true)}
                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5"
                                style={{
                                    background: `linear-gradient(90deg, ${theme.color}, ${theme.color}bb)`,
                                }}
                            >
                                <Play className="h-4 w-4" /> Start challenge
                            </button>
                        </motion.article>
                    );
                })}
            </div>
        </div>
    );
}
