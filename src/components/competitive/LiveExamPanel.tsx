import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Clock,
    Flag,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    CheckCircle2,
    Eraser,
    FileText,
    Grid3X3,
    PanelRightOpen,
    Send,
    ShieldCheck,
    X,
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
    const [showPalette, setShowPalette] = useState(false);
    const eliminatedHere = eliminated[currentQuestionIndex] || [];

    const answeredCount = useMemo(
        () => userAnswers.filter((a) => a !== -1).length,
        [userAnswers],
    );
    const markedCount = useMemo(
        () => markedForReview.filter(Boolean).length,
        [markedForReview],
    );
    const visitedCount = useMemo(
        () => visitedQuestions.filter(Boolean).length,
        [visitedQuestions],
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

    const palette = (
        <>
            <div className="exam-palette__stats">
                <PaletteStat value={answeredCount} label="Answered" tone="answered" />
                <PaletteStat value={markedCount} label="Marked" tone="marked" />
                <PaletteStat value={questions.length - answeredCount} label="Remaining" tone="remaining" />
            </div>

            <div className="exam-palette__heading">
                <div>
                    <p>Question navigator</p>
                    <span>{visitedCount} of {questions.length} visited</span>
                </div>
                <Grid3X3 className="h-4 w-4" />
            </div>

            <div className="exam-palette__grid custom-scrollbar">
                {questions.map((_, i) => {
                    const isAnswered = userAnswers[i] !== -1;
                    const isMarked = markedForReview[i];
                    const isVisited = visitedQuestions[i];
                    const isCurrent = currentQuestionIndex === i;
                    let state = 'idle';
                    if (isAnswered && isMarked) state = 'answered-marked';
                    else if (isAnswered) state = 'answered';
                    else if (isMarked) state = 'marked';
                    else if (isVisited) state = 'visited';

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                onNavigate(i);
                                setShowPalette(false);
                            }}
                            className={`exam-palette__question exam-palette__question--${state} ${
                                isCurrent ? 'exam-palette__question--current' : ''
                            }`}
                            style={
                                isCurrent
                                    ? ({ '--question-accent': theme.color } as React.CSSProperties)
                                    : undefined
                            }
                            aria-label={`Question ${i + 1}, ${state.replace('-', ' ')}`}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            {i + 1}
                            {bookmarked[i] && <span className="exam-palette__bookmark" />}
                        </button>
                    );
                })}
            </div>

            <div className="exam-palette__legend">
                <LegendDot className="border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" label="Not visited" />
                <LegendDot className="bg-rose-500" label="Visited" />
                <LegendDot className="bg-emerald-500" label="Answered" />
                <LegendDot className="bg-violet-500" label="Marked" />
            </div>

            <div className="exam-palette__autosave">
                <ShieldCheck className="h-4 w-4" />
                <span>Answers are auto-saved</span>
            </div>

            <button type="button" onClick={onSubmit} className="exam-submit-button">
                <Send className="h-4 w-4" />
                Review & submit test
            </button>
        </>
    );

    return (
        <div
            ref={panelRef}
            className={`live-exam-panel ${fullscreen ? 'live-exam-panel--fullscreen' : ''}`}
            style={{ '--exam-accent': theme.color } as React.CSSProperties}
        >
            <section className="exam-workspace">
                <header className="exam-command-bar">
                    <div className="exam-command-bar__identity">
                        <span className="exam-command-bar__seal">
                            <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p>{exam.name}</p>
                            <span>{subjectName} · Live assessment</span>
                        </div>
                    </div>

                    <div className="exam-command-bar__status">
                        <span className="hidden sm:inline-flex">
                            <ShieldCheck className="h-3.5 w-3.5" /> Secure session
                        </span>
                        <div className={`exam-mobile-timer ${isLowTime ? 'exam-mobile-timer--low' : ''}`}>
                            <Clock className="h-3.5 w-3.5" />
                            <strong>{formatClock(timeLeftSeconds)}</strong>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPalette(true)}
                            className="exam-icon-button lg:hidden"
                            aria-label="Open question palette"
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="exam-icon-button"
                            aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
                        >
                            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                    </div>
                </header>

                <div className="exam-progress-track">
                    <motion.div
                        style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}bb)` }}
                        initial={false}
                        animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        transition={{ ease: 'easeOut', duration: 0.35 }}
                    />
                </div>

                <div className="exam-question-meta">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="exam-question-number">Question {currentQuestionIndex + 1}</span>
                        <span className="exam-meta-chip">{q.difficulty}</span>
                        <span className="exam-meta-chip hidden sm:inline-flex">~{estMinutes} min</span>
                        {q.examYear && <span className="exam-meta-chip exam-meta-chip--pyq">PYQ {q.examYear}</span>}
                    </div>
                    <div className="exam-marking-scheme">
                        <span>+4 correct</span>
                        <span>−1 incorrect</span>
                    </div>
                </div>

                <div className="exam-mobile-question-strip lg:hidden">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onNavigate(i)}
                            className={`${i === currentQuestionIndex ? 'is-current' : ''} ${
                                userAnswers[i] !== -1 ? 'is-answered' : ''
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <main className="exam-question-scroll custom-scrollbar">
                    <div className="exam-question-content">
                        <div className="exam-question-copy">
                            <p className="exam-question-copy__index">
                                Q{currentQuestionIndex + 1} of {questions.length}
                            </p>
                            <h2>{q.text}</h2>
                        </div>

                        <div className="exam-options">
                            {q.options.map((option, idx) => {
                                const selected = userAnswers[currentQuestionIndex] === idx;
                                const isEliminated = eliminatedHere.includes(idx);
                                return (
                                    <div key={idx} className="exam-option-row">
                                        <motion.button
                                            type="button"
                                            onClick={() => !isEliminated && onAnswerSelect(idx)}
                                            disabled={isEliminated}
                                            whileTap={{ scale: isEliminated ? 1 : 0.995 }}
                                            className={`exam-option ${selected ? 'exam-option--selected' : ''} ${
                                                isEliminated ? 'exam-option--eliminated' : ''
                                            }`}
                                        >
                                            <span className="exam-option__letter">{String.fromCharCode(65 + idx)}</span>
                                            <span className="exam-option__text">{option}</span>
                                            {selected && <CheckCircle2 className="exam-option__check" />}
                                        </motion.button>
                                        <button
                                            type="button"
                                            title={isEliminated ? 'Restore option' : 'Eliminate option'}
                                            aria-label={isEliminated ? `Restore option ${idx + 1}` : `Eliminate option ${idx + 1}`}
                                            onClick={() => onToggleEliminate(idx)}
                                            className={`exam-eliminate-button ${isEliminated ? 'is-active' : ''}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence initial={false}>
                            {(showNotes || notes[currentQuestionIndex]) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="exam-notes"
                                >
                                    <label>
                                        <FileText className="h-4 w-4" /> Private rough notes
                                    </label>
                                    <textarea
                                        value={notes[currentQuestionIndex] || ''}
                                        onChange={(e) => onNoteChange(e.target.value)}
                                        rows={3}
                                        placeholder="Write a formula, shortcut, or elimination reason…"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <footer className="exam-action-bar">
                    <div className="exam-action-bar__tools">
                        <button type="button" onClick={onPrevious} disabled={currentQuestionIndex === 0}>
                            <ChevronLeft className="h-4 w-4" /><span>Previous</span>
                        </button>
                        <button type="button" onClick={onMarkAndNext} className="is-mark">
                            <Flag className="h-4 w-4" /><span>Mark & next</span>
                        </button>
                        <button type="button" onClick={onClear} className="hidden sm:inline-flex">
                            <Eraser className="h-4 w-4" /><span>Clear</span>
                        </button>
                        <button
                            type="button"
                            onClick={onToggleBookmark}
                            className={`hidden sm:inline-flex ${bookmarked[currentQuestionIndex] ? 'is-bookmarked' : ''}`}
                        >
                            <Bookmark className="h-4 w-4" /><span>Bookmark</span>
                        </button>
                        <button type="button" onClick={() => setShowNotes((v) => !v)} className="hidden md:inline-flex">
                            <FileText className="h-4 w-4" /><span>Notes</span>
                        </button>
                    </div>
                    <button type="button" onClick={onSaveAndNext} className="exam-primary-action">
                        <span>{currentQuestionIndex === questions.length - 1 ? 'Save & review' : 'Save & next'}</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </footer>
            </section>

            <aside className="exam-palette hidden lg:flex">
                <div className={`exam-palette__timer ${isLowTime ? 'exam-palette__timer--low' : ''}`}>
                    <div>
                        {isLowTime ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span>Time remaining</span>
                    </div>
                    <strong>{formatClock(timeLeftSeconds)}</strong>
                </div>
                {palette}
            </aside>

            <AnimatePresence>
                {showPalette && (
                    <motion.div
                        className="exam-mobile-drawer lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Question palette"
                    >
                        <button
                            type="button"
                            className="exam-mobile-drawer__backdrop"
                            onClick={() => setShowPalette(false)}
                            aria-label="Close question palette"
                        />
                        <motion.aside
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="exam-mobile-drawer__sheet"
                        >
                            <div className="exam-mobile-drawer__handle" />
                            <div className="exam-mobile-drawer__header">
                                <div>
                                    <p>Question palette</p>
                                    <span>{exam.name} · {subjectName}</span>
                                </div>
                                <button type="button" onClick={() => setShowPalette(false)} aria-label="Close palette">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5">
                                <div className={`exam-palette__timer ${isLowTime ? 'exam-palette__timer--low' : ''}`}>
                                    <div><Clock className="h-4 w-4" /><span>Time remaining</span></div>
                                    <strong>{formatClock(timeLeftSeconds)}</strong>
                                </div>
                                {palette}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
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

function PaletteStat({
    value,
    label,
    tone,
}: {
    value: number;
    label: string;
    tone: 'answered' | 'marked' | 'remaining';
}) {
    return (
        <div className={`exam-palette-stat exam-palette-stat--${tone}`}>
            <strong>{value}</strong>
            <span>{label}</span>
        </div>
    );
}
