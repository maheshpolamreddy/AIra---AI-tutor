import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Layers, Sparkles } from 'lucide-react';
import type { Exam } from '../../data/mockData';
import { EXAM_THEMES, EXAM_IMAGES } from '../../data/examThemes';
import { EXAM_META } from '../../data/examMeta';

interface ExamCardProps {
    exam: Exam;
    index?: number;
    badge?: string;
    onSelect: (exam: Exam) => void;
}

export default function ExamCard({ exam, index = 0, badge, onSelect }: ExamCardProps) {
    const theme = EXAM_THEMES[exam.id] || EXAM_THEMES.gate;
    const bgImageUrl = EXAM_IMAGES[exam.id] || EXAM_IMAGES.gate;
    const meta = EXAM_META[exam.id];

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', damping: 22 }}
            className="h-full"
        >
            <button
                type="button"
                onClick={() => onSelect(exam)}
                className="comp-exam-card group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                    {
                        ['--exam-accent' as string]: theme.color,
                    } as React.CSSProperties
                }
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${bgImageUrl})` }}
                    />
                    <div
                        className="absolute inset-0 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(160deg, ${theme.color}dd 0%, ${theme.color}88 35%, rgba(8,12,24,0.72) 100%)`,
                        }}
                    />
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />
                </div>

                <div className="relative z-10 flex h-full flex-col p-6 sm:p-7">
                    <div className="mb-auto flex items-start justify-between gap-3">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 text-[var(--exam-accent)] shadow-xl backdrop-blur-md transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 dark:bg-slate-950/90"
                        >
                            {React.cloneElement(theme.icon as React.ReactElement, {
                                className: 'h-7 w-7',
                            })}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {(badge || meta?.tier) && (
                                <span className="rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                    {badge || meta?.tier}
                                </span>
                            )}
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-slate-900">
                                <ChevronRight className="h-5 w-5" />
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3 text-white">
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                <Layers className="h-3 w-3" />
                                {exam.subjects.length} subjects
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                <Clock className="h-3 w-3" />
                                {exam.timeMinutes} min
                            </span>
                        </div>
                        <h3 className="font-display text-3xl font-black tracking-tight drop-shadow-lg transition-transform duration-300 group-hover:translate-x-1 sm:text-[2rem]">
                            {exam.name}
                        </h3>
                        <p className="line-clamp-2 text-sm font-medium text-white/85">
                            {meta?.tagline || 'Adaptive practice aligned to the official exam pattern.'}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
                            <Sparkles className="h-3.5 w-3.5" />
                            {meta?.focus || 'Exam-ready practice'}
                        </div>
                    </div>
                </div>
            </button>
        </motion.div>
    );
}
