import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Flag,
    Maximize2,
    Minimize2,
    ChevronLeft,
    Bookmark,
    Eraser,
    Send,
} from 'lucide-react';
import type { Question } from '../../data/competitiveQuestions';
import type { Exam } from '../../data/mockData';
import { EXAM_THEMES } from '../../data/examThemes';

export interface LiveExamPanelProps {
    exam: Exam;
    subjectName: string;
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    visitedQuestions: boolean[];
    markedForReview: boolean[];
    timeLeftSeconds: number;
    isLowTime?: boolean;
    eliminated: Record<number, number[]>;
    bookmarked: boolean[];
    notes: Record<number, string>;
    onAnswerSelect: (optionIndex: number) => void;
    onNavigate: (index: number) => void;
    onClear: () => void;
    onSaveAndNext: () => void;
    onMarkAndNext: () => void;
    onPrevious: () => void;
    onSubmit: () => void;
    onToggleEliminate: (optionIndex: number) => void;
    onToggleBookmark: () => void;
    onNoteChange: (text: string) => void;
}

function formatClock(totalSeconds: number) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function LiveExamPanel({
    exam,
    subjectName,
    questions,
    currentQuestionIndex,
    userAnswers,
    visitedQuestions,
    markedForReview,
    timeLeftSeconds,
    isLowTime,
    eliminated,
    bookmarked,
    notes,
    onAnswerSelect,
    onNavigate,
    onClear,
    onSaveAndNext,
    onMarkAndNext,
    onPrevious,
    onSubmit,
    onToggleEliminate,
    onToggleBookmark,
    onNoteChange,
}: LiveExamPanelProps) {
    const theme = EXAM_THEMES[exam.id] || EXAM_THEMES.gate;
    const q = questions[currentQuestionIndex];
    const panelRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const eliminatedHere = eliminated[currentQuestionIndex] || [];

    const answeredCount = useMemo(
        () => userAnswers.filter((a) => a !== -1).length,
        [userAnswers],
    );
    const markedCount = useMemo(
        () => markedForReview.filter(Boolean).length,
        [markedForReview],
    );

    useEffect(() => {
        const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    const toggleFullscreen = async () => {
        const el = panelRef.current;
        if (!el) return;
        try {
            if (!document.fullscreenElement) await el.requestFullscreen();
            else await document.exitFullscreen();
        } catch {
            /* fullscreen may be blocked */
        }
    };

    if (!q) return null;

    const estMinutes =
        q.difficulty === 'Hard' ? 3 : q.difficulty === 'Medium' ? 2 : 1;

    return (
        <div
            ref={panelRef}
            className="live-exam-panel flex min-h-[70vh] w-full flex-col gap-4 lg:flex-row lg:gap-5"
        >
            {/* Question stage */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-slate-900">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        className="h-full"
                        style={{
                            background: `linear-gradient(90deg, ${theme.color}, ${theme.color}aa)`,
                        }}
                        initial={false}
                        animate={{
                            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                        }}
                        transition={{ ease: 'easeOut', duration: 0.35 }}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                            style={{ backgroundColor: theme.color }}
                        >
                            Q{currentQuestionIndex + 1}/{questions.length}
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {q.difficulty}
                        </span>
                        <span className="hidden rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 sm:inline dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                            ~{estMinutes} min
                        </span>
                        {q.examYear && (
                            <span className="hidden rounded-lg border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 sm:inline dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                                PYQ {q.examYear}
                            </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {subjectName}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            +4
                        </span>
                        <span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            −1
                        </span>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
                        >
                            {fullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
                    <h3 className="mb-6 text-lg font-bold leading-relaxed tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                        {q.text}
                    </h3>

                    <div className="mb-6 grid grid-cols-1 gap-3">
                        {q.options.map((option, idx) => {
                            const selected = userAnswers[currentQuestionIndex] === idx;
                            const isEliminated = eliminatedHere.includes(idx);
                            return (
                                <div key={idx} className="group relative flex items-stretch gap-2">
                                    <motion.button
                                        type="button"
                                        onClick={() => !isEliminated && onAnswerSelect(idx)}
                                        disabled={isEliminated}
                                        whileTap={{ scale: isEliminated ? 1 : 0.99 }}
                                        className={`relative flex flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition sm:gap-4 sm:px-5 sm:py-4 ${
                                            isEliminated
                                                ? 'cursor-not-allowed border-slate-200 opacity-45 dark:border-slate-700'
                                                : selected
                                                  ? 'shadow-md'
                                                  : 'border-slate-200 bg-white/80 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'
                                        }`}
                                        style={
                                            selected && !isEliminated
                                                ? {
                                                      borderColor: theme.color,
                                                      backgroundColor: theme.bgColor,
                                                  }
                                                : undefined
                                        }
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black sm:h-10 sm:w-10 ${
                                                selected && !isEliminated
                                                    ? 'text-white'
                                                    : 'border-2 border-slate-300 text-slate-400 dark:border-slate-600'
                                            }`}
                                            style={
                                                selected && !isEliminated
                                                    ? { backgroundColor: theme.color }
                                                    : undefined
                                            }
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span
                                            className={`flex-1 text-sm font-semibold leading-snug sm:text-base ${
                                                isEliminated
                                                    ? 'line-through text-slate-400'
                                                    : 'text-slate-800 dark:text-slate-100'
                                            }`}
                                        >
                                            {option}
                                        </span>
                                    </motion.button>
                                    <button
                                        type="button"
                                        title="Eliminate option"
                                        onClick={() => onToggleEliminate(idx)}
                                        className={`shrink-0 rounded-xl border px-2.5 text-xs font-bold transition ${
                                            isEliminated
                                                ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40'
                                                : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-slate-700'
                                        }`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {(showNotes || notes[currentQuestionIndex]) && (
                        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Rough notes
                            </label>
                            <textarea
                                value={notes[currentQuestionIndex] || ''}
                                onChange={(e) => onNoteChange(e.target.value)}
                                rows={3}
                                placeholder="Jot a quick elimination reason or formula…"
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={currentQuestionIndex === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </button>
                        <button
                            type="button"
                            onClick={onMarkAndNext}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        >
                            <Flag className="h-3.5 w-3.5" /> Mark & Next
                        </button>
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <Eraser className="h-3.5 w-3.5" /> Clear
                        </button>
                        <button
                            type="button"
                            onClick={onToggleBookmark}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider ${
                                bookmarked[currentQuestionIndex]
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                            <Bookmark className="h-3.5 w-3.5" />
                            {bookmarked[currentQuestionIndex] ? 'Saved' : 'Bookmark'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNotes((v) => !v)}
                            className="rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                            Notes
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onSaveAndNext}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
                        style={{
                            background: `linear-gradient(90deg, ${theme.color}, ${theme.color}cc)`,
                            boxShadow: `0 12px 28px -12px ${theme.color}99`,
                        }}
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Save & Review' : 'Save & Next'}
                    </button>
                </div>
            </div>

            {/* Palette rail */}
            <aside className="flex w-full shrink-0 flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] sm:p-5 lg:w-[300px] xl:w-[320px] dark:border-slate-700/60 dark:bg-slate-900/95">
                <div
                    className={`mb-4 flex items-center justify-between rounded-2xl border px-3.5 py-3 ${
                        isLowTime
                            ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock
                            className={`h-4 w-4 ${isLowTime ? 'animate-pulse text-rose-600' : 'text-slate-400'}`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            Time left
                        </span>
                    </div>
                    <span
                        className={`font-mono text-xl font-black tabular-nums ${
                            isLowTime ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                        }`}
                    >
                        {formatClock(timeLeftSeconds)}
                    </span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-emerald-50 px-2 py-2 dark:bg-emerald-950/30">
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                            {answeredCount}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/80">
                            Answered
                        </div>
                    </div>
                    <div className="rounded-xl bg-violet-50 px-2 py-2 dark:bg-violet-950/30">
                        <div className="text-sm font-black text-violet-700 dark:text-violet-300">
                            {markedCount}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-violet-600/80">
                            Marked
                        </div>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-2 py-2 dark:bg-slate-800">
                        <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {questions.length - answeredCount}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Left
                        </div>
                    </div>
                </div>

                <h4 className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Question palette
                </h4>
                <div className="custom-scrollbar mb-4 grid max-h-[280px] grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 lg:grid-cols-5 lg:max-h-none lg:flex-1">
                    {questions.map((_, i) => {
                        const isAnswered = userAnswers[i] !== -1;
                        const isMarked = markedForReview[i];
                        const isVisited = visitedQuestions[i];
                        const isCurrent = currentQuestionIndex === i;
                        let cls =
                            'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';
                        if (isAnswered && isMarked) cls = 'border-transparent bg-violet-500 text-white';
                        else if (isAnswered) cls = 'border-transparent bg-emerald-500 text-white';
                        else if (isMarked) cls = 'border-transparent bg-violet-500 text-white';
                        else if (isVisited) cls = 'border-transparent bg-rose-500 text-white';

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onNavigate(i)}
                                className={`relative flex h-10 w-full items-center justify-center rounded-xl border-2 text-sm font-bold transition ${cls} ${
                                    isCurrent ? 'ring-4 ring-offset-1 scale-105' : 'hover:scale-105'
                                }`}
                                style={
                                    isCurrent
                                        ? ({ ['--tw-ring-color' as string]: `${theme.color}55` } as React.CSSProperties)
                                        : undefined
                                }
                            >
                                {i + 1}
                                {bookmarked[i] && (
                                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mb-4 grid grid-cols-2 gap-x-2 gap-y-2 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <LegendDot className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" label="Not visited" />
                    <LegendDot className="bg-rose-500" label="Not answered" />
                    <LegendDot className="bg-emerald-500" label="Answered" />
                    <LegendDot className="bg-violet-500" label="Marked" />
                </div>

                <p className="mb-3 text-center text-[10px] font-medium text-slate-400">
                    Progress auto-saved locally
                </p>

                <button
                    type="button"
                    onClick={onSubmit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
                >
                    <Send className="h-4 w-4" /> Submit test
                </button>
            </aside>
        </div>
    );
}

function LegendDot({ className, label }: { className: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`h-3.5 w-3.5 rounded ${className}`} />
            <span>{label}</span>
        </div>
    );
}
