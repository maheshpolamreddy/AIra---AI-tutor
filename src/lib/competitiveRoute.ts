/**
 * URL contract for Competitive Mode.
 *
 * Every screen inside `/student/competitive` is addressable so a refresh, a
 * shared link, or the browser back button lands exactly where the student was
 * instead of resetting to the exam catalog.
 */
import type { Exam, ExamSubject, Paper } from '../data/mockData';
import { COMPETITIVE_EXAMS } from '../data/mockData';
import type { Question } from '../data/competitiveQuestions';

export const COMPETITIVE_SECTIONS = [
    'exams',
    'weekly',
    'quizzes',
    'questionary',
    'pyqs',
    'mock',
    'performance',
] as const;

export type CompetitiveSection = (typeof COMPETITIVE_SECTIONS)[number];

export const SECTION_PARAM = 'section';

/** Params owned by the flows; cleared whenever the student switches sections. */
export const FLOW_PARAMS = [
    'step',
    'exam',
    'subject',
    'paper',
    'topic',
    'chapter',
    'challenge',
    'q',
] as const;

export function normalizeSection(value: string | null): CompetitiveSection {
    return COMPETITIVE_SECTIONS.includes(value as CompetitiveSection)
        ? (value as CompetitiveSection)
        : 'exams';
}

export function findExam(examId: string | null): Exam | null {
    if (!examId) return null;
    return COMPETITIVE_EXAMS.find((exam) => exam.id === examId) ?? null;
}

export function findSubject(exam: Exam | null, subjectId: string | null): ExamSubject | null {
    if (!exam || !subjectId) return null;
    return exam.subjects.find((subject) => subject.id === subjectId) ?? null;
}

export function findPaper(exam: Exam | null, year: string | null): Paper | null {
    if (!exam || !year) return null;
    return exam.papers.find((paper) => String(paper.year) === year) ?? null;
}

export type ExamFlowStep = 'exam' | 'subject' | 'paper' | 'solving' | 'result';

export function normalizeExamStep(value: string | null): ExamFlowStep {
    switch (value) {
        case 'subject':
        case 'paper':
        case 'solving':
        case 'result':
            return value;
        default:
            return 'exam';
    }
}

/* ── Live exam session persistence ───────────────────────────────────────── */

export interface ExamDraft {
    version: 2;
    flowType: string;
    examId: string;
    subjectId: string;
    paperYear?: string;
    step: 'solving' | 'result';
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    visitedQuestions: boolean[];
    markedForReview: boolean[];
    bookmarked: boolean[];
    eliminated: Record<number, number[]>;
    notes: Record<number, string>;
    timer: number;
    elapsedSeconds: number;
    savedAt: number;
}

/** Sessions older than this are treated as abandoned. */
const DRAFT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function draftKey(flowType: string): string {
    return `aira-exam-draft:${flowType}`;
}

export function saveExamDraft(draft: ExamDraft): void {
    try {
        sessionStorage.setItem(draftKey(draft.flowType), JSON.stringify(draft));
    } catch {
        /* storage full or unavailable — drafts are best effort */
    }
}

export function loadExamDraft(flowType: string): ExamDraft | null {
    try {
        const raw = sessionStorage.getItem(draftKey(flowType));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ExamDraft;
        if (parsed?.version !== 2 || !Array.isArray(parsed.questions) || !parsed.questions.length) {
            return null;
        }
        if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
            clearExamDraft(flowType);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function clearExamDraft(flowType: string): void {
    try {
        sessionStorage.removeItem(draftKey(flowType));
    } catch {
        /* ignore */
    }
}

/* ── Topic quiz session persistence ──────────────────────────────────────── */

export interface QuizDraft {
    version: 1;
    subjectId: string;
    chapterId: string;
    step: 'solving' | 'result';
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    timer: number;
    savedAt: number;
}

const QUIZ_DRAFT_KEY = 'aira-topic-quiz-draft';

export function saveQuizDraft(draft: QuizDraft): void {
    try {
        sessionStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify(draft));
    } catch {
        /* ignore */
    }
}

export function loadQuizDraft(): QuizDraft | null {
    try {
        const raw = sessionStorage.getItem(QUIZ_DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as QuizDraft;
        if (parsed?.version !== 1 || !Array.isArray(parsed.questions) || !parsed.questions.length) {
            return null;
        }
        if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
            clearQuizDraft();
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function clearQuizDraft(): void {
    try {
        sessionStorage.removeItem(QUIZ_DRAFT_KEY);
    } catch {
        /* ignore */
    }
}

/* ── AI explanation payload persistence ──────────────────────────────────── */

export interface ExplainPayload {
    competitiveQuestion: unknown;
    theme?: { color: string; bgColor: string; gradient: string };
    userAnswer?: number;
    examName?: string;
    returnTo?: string;
}

const EXPLAIN_KEY = 'aira-competitive-explain';

export function saveExplainPayload(payload: ExplainPayload): void {
    try {
        sessionStorage.setItem(EXPLAIN_KEY, JSON.stringify(payload));
    } catch {
        /* ignore */
    }
}

export function loadExplainPayload(): ExplainPayload | null {
    try {
        const raw = sessionStorage.getItem(EXPLAIN_KEY);
        return raw ? (JSON.parse(raw) as ExplainPayload) : null;
    } catch {
        return null;
    }
}
