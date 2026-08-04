import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock3,
  Lock,
  Play,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { COMPETITIVE_EXAMS } from '../../data/mockData';
import { EXAM_IMAGES, EXAM_THEMES } from '../../data/examThemes';
import ExamFlow from './ExamFlow';
import { PremiumSelectionCard } from './CompetitiveCards';
import type { WeeklyExamSession } from '../../types/weeklyExam';
import {
  formatWindowLabel,
  getIsoWeekKeyIst,
  getSessionWindowState,
  listPublishedForWeek,
} from '../../services/weeklyExamSchedule';

interface WeeklyTestsFlowProps {
  onExamStateChange?: (active: boolean) => void;
}

export default function WeeklyTestsFlow({ onExamStateChange }: WeeklyTestsFlowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<WeeklyExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const weekKey = useMemo(() => getIsoWeekKeyIst(), []);
  const rawChallenge = searchParams.get('weeklySession') || searchParams.get('challenge');

  const activeSession = useMemo(() => {
    if (!rawChallenge) return null;
    const found = sessions.find((s) => s.id === rawChallenge);
    if (found) return found;
    // Ignore legacy static challenge ids like "speed-sprint"
    if (!rawChallenge.startsWith('wes_')) return null;
    return null;
  }, [sessions, rawChallenge]);

  const weeklySessionId = activeSession?.id ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listPublishedForWeek(weekKey);
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load weekly exams');
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Recompute live/upcoming every 30s
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const launchSession = useCallback(
    (session: WeeklyExamSession) => {
      const state = getSessionWindowState(session, new Date(nowTick));
      if (state !== 'live') return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('weeklySession', session.id);
        next.set('challenge', session.id);
        next.set('exam', session.examId);
        if (session.subjectId) next.set('subject', session.subjectId);
        else next.delete('subject');
        next.set('step', session.subjectId ? (session.mode === 'pyq' ? 'paper' : 'subject') : 'exam');
        // subject step with subject already set → ExamFlow will advance; for mock with subject go to subject selection confirm
        if (session.subjectId && session.mode === 'mock') {
          next.set('step', 'subject');
        }
        return next;
      });
    },
    [nowTick, setSearchParams],
  );

  const weekLabel = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  if (weeklySessionId && activeSession && getSessionWindowState(activeSession, new Date(nowTick)) === 'live') {
    return (
      <ExamFlow
        isDashboardView
        onExamStateChange={onExamStateChange}
        flowType="weekly"
        weeklySession={activeSession}
      />
    );
  }

  // Stale/ended deep link — clear and show catalog
  if (weeklySessionId && !loading && activeSession && getSessionWindowState(activeSession, new Date(nowTick)) !== 'live') {
    // fall through to list; params may still be set — show locked notice
  }

  const nextOpen = sessions
    .map((s) => ({ s, state: getSessionWindowState(s, new Date(nowTick)) }))
    .filter((x) => x.state === 'upcoming')
    .sort((a, b) => a.s.startsAt.localeCompare(b.s.startsAt))[0];

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 sm:p-8 dark:border-amber-900/30 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              <CalendarDays className="h-3.5 w-3.5" /> Week of {weekLabel} · {weekKey}
            </p>
            <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Weekly assessments
            </h2>
            <p className="mt-2 max-w-lg text-sm font-medium text-slate-600 dark:text-slate-300">
              Admin-published Saturday &amp; Sunday exams. Open only during the live window (IST).
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
            <Clock3 className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekend window</div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {nextOpen
                  ? `Opens ${formatWindowLabel(nextOpen.s.startsAt)}`
                  : sessions.some((s) => getSessionWindowState(s, new Date(nowTick)) === 'live')
                    ? 'Exams live now'
                    : 'No live exam right now'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <Lock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">No weekend exam published</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
            An admin will publish Saturday and Sunday exams here. Check back this weekend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sessions.map((session, i) => {
            const exam = COMPETITIVE_EXAMS.find((e) => e.id === session.examId);
            const theme = EXAM_THEMES[session.examId] || EXAM_THEMES.gate;
            const state = getSessionWindowState(session, new Date(nowTick));
            const subject = exam?.subjects.find((s) => s.id === session.subjectId);
            const isLive = state === 'live';
            const badge =
              state === 'live'
                ? 'Live now'
                : state === 'upcoming'
                  ? 'Opens soon'
                  : state === 'ended'
                    ? 'Ended'
                    : 'Locked';

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={!isLive ? 'opacity-80' : undefined}
              >
                <PremiumSelectionCard
                  title={session.title}
                  eyebrow={`${session.day === 'saturday' ? 'Saturday' : 'Sunday'} · ${exam?.name || session.examId}`}
                  description={
                    isLive
                      ? `${subject?.name || 'Subject'} · ${session.mode.toUpperCase()} · ends ${formatWindowLabel(session.endsAt)}`
                      : state === 'upcoming'
                        ? `Opens ${formatWindowLabel(session.startsAt)} · closes ${formatWindowLabel(session.endsAt)}`
                        : `Closed · was ${formatWindowLabel(session.startsAt)} – ${formatWindowLabel(session.endsAt)}`
                  }
                  meta={
                    <span className="inline-flex items-center gap-2">
                      {isLive ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {isLive ? 'Start exam' : state === 'upcoming' ? 'Not open yet' : 'Unavailable'}
                    </span>
                  }
                  icon={<Sparkles className="h-5 w-5" />}
                  accent={theme.color}
                  image={EXAM_IMAGES[session.examId]}
                  badge={badge}
                  onClick={() => {
                    if (isLive) launchSession(session);
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
