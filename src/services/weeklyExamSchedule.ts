/**
 * Weekly exam schedule service.
 * Primary: Firestore `weeklyExamSchedules`
 * Fallback: localStorage (demo admin / offline / rules not deployed)
 *
 * Demo admins have no Firebase Auth token — Firestore calls can hang or
 * deny forever. Those sessions always use localStorage only.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import type {
  WeeklyExamDay,
  WeeklyExamSession,
  WeeklyExamSessionInput,
  WeeklyExamStatus,
  WeeklyExamWindowState,
} from '../types/weeklyExam';

export const WEEKLY_EXAM_COLLECTION = 'weeklyExamSchedules';
const LOCAL_KEY = 'aira-weekly-exam-schedules-v1';
const IST = 'Asia/Kolkata';
const FIRESTORE_TIMEOUT_MS = 4000;

function assertAdmin(): void {
  const { role } = useAuthStore.getState();
  if (role !== 'admin') {
    throw new Error('Only admins can manage weekly exam schedules.');
  }
}

/** Demo / unauthenticated clients cannot satisfy Firestore admin rules. */
function useLocalOnly(): boolean {
  const { isDemo } = useAuthStore.getState();
  return Boolean(isDemo) || !auth.currentUser;
}

function withTimeout<T>(promise: Promise<T>, ms = FIRESTORE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Firestore operation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Format a Date as YYYY-MM-DD in IST. */
export function formatDateInIst(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Parts of "now" in IST. */
export function getIstParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday || '',
  };
}

/**
 * Build an ISO UTC string for an IST civil datetime.
 * Example: istToUtcIso(2026, 8, 9, 0, 0, 0) → Saturday Aug 9 2026 00:00 IST
 */
export function istToUtcIso(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): string {
  const asUtcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  // IST is UTC+5:30 — convert by subtracting offset
  return new Date(asUtcGuess - (5 * 60 + 30) * 60 * 1000).toISOString();
}

/** ISO week key in IST, e.g. "2026-W32". */
export function getIsoWeekKeyIst(date = new Date()): string {
  const parts = getIstParts(date);
  // Use Thursday of the IST week to determine ISO week year/number
  const utcNoon = Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  const d = new Date(utcNoon);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Next Saturday and Sunday (IST civil dates) for the week containing `date`, or upcoming weekend. */
export function getWeekendDatesIst(date = new Date()): {
  saturday: { y: number; m: number; d: number };
  sunday: { y: number; m: number; d: number };
} {
  const parts = getIstParts(date);
  const utcNoon = Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  const ref = new Date(utcNoon);
  const dow = ref.getUTCDay(); // 0 Sun … 6 Sat (approx for civil day via noon)
  // Map: find Saturday of this week (if today is Sun, Saturday was yesterday)
  const toSat = dow === 6 ? 0 : dow === 0 ? -1 : 6 - dow;
  const sat = new Date(ref);
  sat.setUTCDate(ref.getUTCDate() + toSat);
  const sun = new Date(sat);
  sun.setUTCDate(sat.getUTCDate() + 1);
  return {
    saturday: { y: sat.getUTCFullYear(), m: sat.getUTCMonth() + 1, d: sat.getUTCDate() },
    sunday: { y: sun.getUTCFullYear(), m: sun.getUTCMonth() + 1, d: sun.getUTCDate() },
  };
}

export function defaultWeekendWindowsIst(date = new Date()): {
  saturday: { startsAt: string; endsAt: string };
  sunday: { startsAt: string; endsAt: string };
  weekKey: string;
} {
  const { saturday, sunday } = getWeekendDatesIst(date);
  return {
    weekKey: getIsoWeekKeyIst(date),
    saturday: {
      startsAt: istToUtcIso(saturday.y, saturday.m, saturday.d, 0, 0, 0),
      endsAt: istToUtcIso(saturday.y, saturday.m, saturday.d, 23, 59, 59),
    },
    sunday: {
      startsAt: istToUtcIso(sunday.y, sunday.m, sunday.d, 0, 0, 0),
      endsAt: istToUtcIso(sunday.y, sunday.m, sunday.d, 23, 59, 59),
    },
  };
}

export function getSessionWindowState(
  session: Pick<WeeklyExamSession, 'startsAt' | 'endsAt' | 'status'>,
  now = new Date(),
): WeeklyExamWindowState {
  if (session.status !== 'published') return 'locked';
  const t = now.getTime();
  const start = new Date(session.startsAt).getTime();
  const end = new Date(session.endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'locked';
  if (t < start) return 'upcoming';
  if (t > end) return 'ended';
  return 'live';
}

export function isSessionLive(session: WeeklyExamSession, now = new Date()): boolean {
  return getSessionWindowState(session, now) === 'live';
}

function readLocal(): WeeklyExamSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeeklyExamSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(sessions: WeeklyExamSession[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions));
}

function saveLocalSession(session: WeeklyExamSession): void {
  const local = readLocal().filter((s) => s.id !== session.id);
  local.push(session);
  writeLocal(local);
}

function normalizeSession(data: Record<string, unknown>, id: string): WeeklyExamSession {
  return {
    id,
    weekKey: String(data.weekKey || ''),
    day: (data.day === 'sunday' ? 'sunday' : 'saturday') as WeeklyExamDay,
    title: String(data.title || 'Weekly Exam'),
    examId: String(data.examId || 'jee-main'),
    subjectId: data.subjectId ? String(data.subjectId) : undefined,
    mode: data.mode === 'pyq' ? 'pyq' : 'mock',
    startsAt: String(data.startsAt || ''),
    endsAt: String(data.endsAt || ''),
    status: (['draft', 'published', 'archived'].includes(String(data.status))
      ? data.status
      : 'draft') as WeeklyExamStatus,
    createdBy: String(data.createdBy || 'unknown'),
    updatedAt: String(data.updatedAt || nowIso()),
  };
}

/** Firestore rejects `undefined` field values. */
function toFirestorePayload(session: WeeklyExamSession): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: session.id,
    weekKey: session.weekKey,
    day: session.day,
    title: session.title,
    examId: session.examId,
    mode: session.mode,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    status: session.status,
    createdBy: session.createdBy,
    updatedAt: session.updatedAt,
  };
  if (session.subjectId) payload.subjectId = session.subjectId;
  return payload;
}

async function tryFirestoreWrite(session: WeeklyExamSession): Promise<boolean> {
  if (useLocalOnly()) return false;
  try {
    await withTimeout(
      setDoc(doc(db, WEEKLY_EXAM_COLLECTION, session.id), toFirestorePayload(session), {
        merge: true,
      }),
    );
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] Firestore write failed, using local fallback', err);
    }
    return false;
  }
}

async function tryFirestoreListAll(): Promise<WeeklyExamSession[] | null> {
  if (useLocalOnly()) return null;
  try {
    const snap = await withTimeout(getDocs(collection(db, WEEKLY_EXAM_COLLECTION)));
    return snap.docs.map((d) => normalizeSession(d.data() as Record<string, unknown>, d.id));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] Firestore list failed, using local fallback', err);
    }
    return null;
  }
}

async function tryFirestoreListPublished(weekKey: string): Promise<WeeklyExamSession[] | null> {
  if (useLocalOnly()) return null;
  try {
    const q = query(
      collection(db, WEEKLY_EXAM_COLLECTION),
      where('weekKey', '==', weekKey),
      where('status', '==', 'published'),
    );
    const snap = await withTimeout(getDocs(q));
    return snap.docs.map((d) => normalizeSession(d.data() as Record<string, unknown>, d.id));
  } catch (err) {
    // Composite index may be missing — fall back to client filter
    try {
      const snap = await withTimeout(getDocs(collection(db, WEEKLY_EXAM_COLLECTION)));
      return snap.docs
        .map((d) => normalizeSession(d.data() as Record<string, unknown>, d.id))
        .filter((s) => s.weekKey === weekKey && s.status === 'published');
    } catch (err2) {
      if (import.meta.env.DEV) {
        console.warn('[weeklyExam] Firestore published list failed', err, err2);
      }
      return null;
    }
  }
}

function sortByUpdatedDesc(sessions: WeeklyExamSession[]): WeeklyExamSession[] {
  return [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function mergeById(
  local: WeeklyExamSession[],
  remote: WeeklyExamSession[],
): WeeklyExamSession[] {
  const byId = new Map<string, WeeklyExamSession>();
  for (const s of remote) byId.set(s.id, s);
  // Local wins on same id when newer (covers offline edits that never reached Firestore)
  for (const s of local) {
    const existing = byId.get(s.id);
    if (!existing || s.updatedAt >= existing.updatedAt) byId.set(s.id, s);
  }
  return [...byId.values()];
}

export async function listAllForAdmin(): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const local = readLocal();
  const remote = await tryFirestoreListAll();
  if (!remote) return sortByUpdatedDesc(local);
  return sortByUpdatedDesc(mergeById(local, remote));
}

export async function listPublishedForWeek(weekKey: string): Promise<WeeklyExamSession[]> {
  const local = readLocal().filter((s) => s.weekKey === weekKey && s.status === 'published');
  const remote = await tryFirestoreListPublished(weekKey);
  if (!remote) {
    return local.sort((a, b) => a.day.localeCompare(b.day));
  }
  return mergeById(local, remote).sort((a, b) => a.day.localeCompare(b.day));
}

export async function getSessionById(id: string): Promise<WeeklyExamSession | null> {
  const localHit = readLocal().find((s) => s.id === id) ?? null;
  if (useLocalOnly()) return localHit;

  try {
    const snap = await withTimeout(getDoc(doc(db, WEEKLY_EXAM_COLLECTION, id)));
    if (snap.exists()) {
      const remote = normalizeSession(snap.data() as Record<string, unknown>, snap.id);
      if (!localHit || remote.updatedAt >= localHit.updatedAt) return remote;
      return localHit;
    }
  } catch {
    /* fall through */
  }
  return localHit;
}

export async function upsertSession(input: WeeklyExamSessionInput): Promise<WeeklyExamSession> {
  assertAdmin();
  const { user, isDemo } = useAuthStore.getState();

  const startsAt = input.startsAt;
  const endsAt = input.endsAt;
  if (!startsAt || !endsAt || Number.isNaN(Date.parse(startsAt)) || Number.isNaN(Date.parse(endsAt))) {
    throw new Error('Start and end times are required.');
  }
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new Error('End time must be after start time.');
  }
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.examId) {
    throw new Error('Exam is required.');
  }

  const id = input.id || `wes_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const existing = input.id ? await getSessionById(input.id) : null;
  const session: WeeklyExamSession = {
    id,
    weekKey: input.weekKey,
    day: input.day,
    title: input.title.trim() || 'Weekly Exam',
    examId: input.examId,
    subjectId: input.subjectId || undefined,
    mode: input.mode,
    startsAt,
    endsAt,
    status: input.status,
    createdBy: input.createdBy || existing?.createdBy || user?.id || (isDemo ? 'demo-admin' : 'admin'),
    updatedAt: nowIso(),
  };

  // Local-first so the admin UI never hangs on Firestore
  saveLocalSession(session);
  await tryFirestoreWrite(session);
  return session;
}

export async function publishSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'published' });
}

export async function unpublishSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'draft' });
}

export async function archiveSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'archived' });
}

export function getActiveSessions(
  sessions: WeeklyExamSession[],
  now = new Date(),
): WeeklyExamSession[] {
  return sessions.filter((s) => isSessionLive(s, now));
}

/** Seed Sat + Sun published sessions for the current IST weekend (admin only). */
export async function seedThisWeekendDefaults(): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const windows = defaultWeekendWindowsIst();
  const existing = await listAllForAdmin();
  const forWeek = existing.filter((s) => s.weekKey === windows.weekKey && s.status !== 'archived');

  const ensure = async (
    day: WeeklyExamDay,
    title: string,
    examId: string,
    subjectId: string,
    mode: 'mock' | 'pyq',
    range: { startsAt: string; endsAt: string },
  ) => {
    const found = forWeek.find((s) => s.day === day);
    if (found) {
      return upsertSession({
        ...found,
        title,
        examId,
        subjectId,
        mode,
        startsAt: range.startsAt,
        endsAt: range.endsAt,
        status: 'published',
      });
    }
    return upsertSession({
      weekKey: windows.weekKey,
      day,
      title,
      examId,
      subjectId,
      mode,
      startsAt: range.startsAt,
      endsAt: range.endsAt,
      status: 'published',
    });
  };

  const sat = await ensure(
    'saturday',
    'Saturday Weekly Mock',
    'jee-main',
    'phy',
    'mock',
    windows.saturday,
  );
  const sun = await ensure(
    'sunday',
    'Sunday Weekly PYQ',
    'neet',
    'bot',
    'pyq',
    windows.sunday,
  );
  return [sat, sun];
}

/** Duplicate published sessions from a weekKey into the next ISO week. */
export async function duplicateWeekToNext(fromWeekKey: string): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const all = await listAllForAdmin();
  const source = all.filter((s) => s.weekKey === fromWeekKey && s.status === 'published');
  if (!source.length) throw new Error('No published sessions to duplicate for that week.');

  // Approximate next week windows from current + 7 days
  const nextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const windows = defaultWeekendWindowsIst(nextDate);
  const created: WeeklyExamSession[] = [];

  for (const s of source) {
    const range = s.day === 'saturday' ? windows.saturday : windows.sunday;
    created.push(
      await upsertSession({
        weekKey: windows.weekKey,
        day: s.day,
        title: s.title,
        examId: s.examId,
        subjectId: s.subjectId,
        mode: s.mode,
        startsAt: range.startsAt,
        endsAt: range.endsAt,
        status: 'draft',
      }),
    );
  }
  return created;
}

export function formatWindowLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
