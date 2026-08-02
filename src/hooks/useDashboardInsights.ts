import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAnalyticsStore, scoredSessions } from '../stores/analyticsStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import { schoolGrades } from '../data/schoolCurriculum';
import type { SessionAnalytics } from '../types';

import { subjectHex } from '../components/dashboard/theme/subjectColors';

export type TopicCardModel = {
  id: string;
  name: string;
  subject: string;
  subjectId: string;
  grade: string;
  gradeId: string;
  difficulty: string;
  duration: string;
  emoji: string;
  color: string;
  mastery: number;
  completed: boolean;
  inProgress: boolean;
  isNew: boolean;
  lastStudiedAt?: string;
  totalMinutes: number;
};

export function subjectEmoji(subjectId: string): string {
  return subjectId;
}

export function subjectColor(subjectId: string): string {
  return subjectHex(subjectId);
}

function localDay(value: string | number): number | null {
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((time - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

function buildTopicIndex() {
  const byId = new Map<string, Omit<TopicCardModel, 'mastery' | 'completed' | 'inProgress' | 'isNew' | 'lastStudiedAt' | 'totalMinutes'>>();
  for (const grade of schoolGrades) {
    for (const subject of grade.subjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          byId.set(topic.id, {
            id: topic.id,
            name: topic.name,
            subject: subject.name,
            subjectId: subject.id,
            grade: grade.name,
            gradeId: grade.id,
            difficulty: topic.difficulty || 'beginner',
            duration: topic.duration || '20 min',
            emoji: subjectEmoji(subject.id),
            color: subject.color || subjectColor(subject.id),
          });
        }
      }
    }
  }
  return byId;
}

function minutesThisWeek(sessions: SessionAnalytics[], weekOffset = 0): number {
  const today = localDay(Date.now());
  if (today === null) return 0;
  const end = today - weekOffset * 7;
  const start = end - 6;
  let total = 0;
  for (const s of sessions) {
    const day = localDay(s.date);
    if (day !== null && day >= start && day <= end) total += s.durationMinutes;
  }
  return total;
}

export function useDashboardInsights() {
  const { sessions, metrics, achievements } = useAnalyticsStore(
    useShallow((s) => ({
      sessions: s.sessions,
      metrics: s.metrics,
      achievements: s.achievements,
    }))
  );
  const progressMap = useCurriculumStore((s) => s.progressMap);
  const lastAccessedGrade = useCurriculumStore((s) => s.lastAccessedGrade);
  const lastAccessedSubject = useCurriculumStore((s) => s.lastAccessedSubject);

  return useMemo(() => {
    const topicIndex = buildTopicIndex();
    const completedFromCurriculum = new Set<string>();
    for (const progress of Object.values(progressMap)) {
      progress.completedTopics.forEach((id) => completedFromCurriculum.add(id));
    }

    const sessionByTopic = new Map<string, SessionAnalytics[]>();
    for (const session of sessions) {
      if (!session.topicId || session.topicId === 'unknown') continue;
      const list = sessionByTopic.get(session.topicId) || [];
      list.push(session);
      sessionByTopic.set(session.topicId, list);
    }

    const allTopics: TopicCardModel[] = [];
    for (const [id, base] of topicIndex) {
      const topicSessions = sessionByTopic.get(id) || [];
      const totalMinutes = topicSessions.reduce((a, s) => a + s.durationMinutes, 0);
      const last = topicSessions.reduce<string | undefined>((latest, s) => {
        if (!latest) return s.date;
        return new Date(s.date) > new Date(latest) ? s.date : latest;
      }, undefined);
      const completed =
        completedFromCurriculum.has(id) ||
        topicSessions.some((s) => s.completionPercentage >= 100);
      const inProgress = !completed && totalMinutes > 0;
      const mastery = Math.max(
        metrics.conceptMastery[id] || 0,
        ...topicSessions.map((s) => s.quizScore ?? s.completionPercentage)
      );
      const isNew =
        !completed &&
        !inProgress &&
        totalMinutes === 0 &&
        base.difficulty === 'beginner' &&
        Boolean(lastAccessedGrade && base.gradeId === lastAccessedGrade);

      allTopics.push({
        ...base,
        mastery: Math.round(mastery),
        completed,
        inProgress,
        isNew,
        lastStudiedAt: last,
        totalMinutes,
      });
    }

    // Subject rollups for strength / focus
    const subjectStats = new Map<
      string,
      { name: string; id: string; minutes: number; scoreSum: number; scoreCount: number; completed: number; emoji: string }
    >();
    for (const topic of allTopics) {
      const cur = subjectStats.get(topic.subjectId) || {
        name: topic.subject,
        id: topic.subjectId,
        minutes: 0,
        scoreSum: 0,
        scoreCount: 0,
        completed: 0,
        emoji: topic.emoji,
      };
      cur.minutes += topic.totalMinutes;
      if (topic.mastery > 0) {
        cur.scoreSum += topic.mastery;
        cur.scoreCount += 1;
      }
      if (topic.completed) cur.completed += 1;
      subjectStats.set(topic.subjectId, cur);
    }

    const subjectList = [...subjectStats.values()]
      .map((s) => ({
        ...s,
        avgScore: s.scoreCount ? Math.round(s.scoreSum / s.scoreCount) : 0,
      }))
      .filter((s) => s.minutes > 0 || s.scoreCount > 0 || s.completed > 0);

    const strength = [...subjectList].sort((a, b) => b.avgScore - a.avgScore || b.minutes - a.minutes)[0] || null;
    const focus =
      [...subjectList]
        .filter((s) => s.avgScore > 0 || s.minutes > 0)
        .sort((a, b) => a.avgScore - b.avgScore || a.minutes - b.minutes)[0] ||
      [...subjectStats.values()].find(
        (s) => s.id === lastAccessedSubject
      ) ||
      null;

    // Next recommended topic: in-progress first, then unfinished in last subject, then any beginner
    const nextTopic =
      allTopics.find((t) => t.inProgress) ||
      allTopics.find(
        (t) =>
          !t.completed &&
          lastAccessedSubject &&
          t.subjectId === lastAccessedSubject
      ) ||
      allTopics.find((t) => !t.completed && t.difficulty === 'beginner') ||
      allTopics[0] ||
      null;

    const thisWeekMin = minutesThisWeek(sessions, 0);
    const lastWeekMin = minutesThisWeek(sessions, 1);
    const growthPct =
      lastWeekMin > 0
        ? Math.round(((thisWeekMin - lastWeekMin) / lastWeekMin) * 100)
        : thisWeekMin > 0
          ? 100
          : 0;

    // Learning journey points from weeklyHours (7 days, oldest → newest)
    const weekly = metrics.weeklyHours.length === 7 ? metrics.weeklyHours : [0, 0, 0, 0, 0, 0, 0];
    const maxH = Math.max(...weekly, 0.1);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labeledPoints = weekly.map((h, i) => {
      const dayOffset = i - 6; // -6 … 0
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const x = 20 + (i / 6) * 660;
      const y = 160 - (h / maxH) * 130;
      return {
        x,
        y,
        hours: h,
        label: dayOffset === 0 ? 'Today' : dayLabels[d.getDay()],
      };
    });

    const scored = scoredSessions(sessions);
    const readiness = (() => {
      const accuracy = metrics.averageQuizScore;
      const streakBoost = Math.min(metrics.streakDays * 4, 20);
      const volumeBoost = Math.min(metrics.topicsCompleted * 5, 25);
      const hourBoost = Math.min(metrics.totalHours * 2, 20);
      if (sessions.length === 0) return 8;
      return Math.min(99, Math.round(accuracy * 0.45 + streakBoost + volumeBoost + hourBoost * 0.5 + 10));
    })();

    // Weekly quiz averages for exam bars (last 7 days with scores; pad with 0)
    const today = localDay(Date.now());
    const weeklyScores = new Array(7).fill(0) as number[];
    const weeklyScoreCounts = new Array(7).fill(0) as number[];
    if (today !== null) {
      for (const s of scored) {
        const day = localDay(s.date);
        if (day === null) continue;
        const offset = today - day;
        if (offset >= 0 && offset < 7) {
          const idx = 6 - offset;
          weeklyScores[idx] += s.quizScore;
          weeklyScoreCounts[idx] += 1;
        }
      }
    }
    const weeklyQuizBars = weeklyScores.map((sum, i) =>
      weeklyScoreCounts[i] ? Math.round(sum / weeklyScoreCounts[i]) : Math.round((weekly[i] / maxH) * 70)
    );

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((s) => {
        const meta = topicIndex.get(s.topicId);
        return {
          ...s,
          topicName: meta?.name || s.topicId,
          emoji: meta?.emoji || '✨',
          subject: meta?.subject || 'Lesson',
        };
      });

    const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
    const liveNow = sessions.some((s) => Date.now() - new Date(s.date).getTime() < 30 * 60_000);

    const completedCount = allTopics.filter((t) => t.completed).length;
    const inProgressCount = allTopics.filter((t) => t.inProgress).length;

    // Peer percentile heuristic from accuracy + consistency
    const peerPercentile = Math.min(
      99,
      Math.max(
        12,
        Math.round(
          metrics.averageQuizScore * 0.55 +
            Math.min(metrics.streakDays * 3, 18) +
            Math.min(metrics.topicsCompleted * 2, 20) +
            (sessions.length > 0 ? 8 : 0)
        )
      )
    );

    const efficiencyMinPerQ =
      scored.length > 0
        ? Math.round(
            (scored.reduce((a, s) => a + s.durationMinutes, 0) / Math.max(scored.length, 1)) * 10
          ) / 10
        : 0;

    return {
      metrics,
      readiness,
      growthPct,
      thisWeekMin,
      lastWeekMin,
      journeyPoints: labeledPoints,
      strength,
      focus,
      nextTopic,
      peerPercentile,
      weeklyQuizBars,
      recentSessions,
      unlockedAchievements,
      liveNow,
      completedCount,
      inProgressCount,
      allTopics,
      efficiencyMinPerQ,
      hasActivity: sessions.length > 0,
    };
  }, [sessions, metrics, achievements, progressMap, lastAccessedGrade, lastAccessedSubject]);
}
