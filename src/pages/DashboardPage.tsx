import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '../stores/userStore';
import { Sparkles, GraduationCap, Rocket } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { displayNameForUser } from '../components/common/UserAvatar';
import { toast } from '../stores/toastStore';
import { getRoutesForRole, studentRoutes } from '../utils/routes';
import { redirectAfterSignOut } from '../lib/authSession';
import { useTeachingStore } from '../stores/teachingStore';
import { useDashboardInsights, type TopicCardModel } from '../hooks/useDashboardInsights';
import { useAnalyticsStore } from '../stores/analyticsStore';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import HeroCard from '../components/dashboard/HeroCard';
import SuperStrengthCard from '../components/dashboard/SuperStrengthCard';
import NextMissionCard from '../components/dashboard/NextMissionCard';
import LearningJourneyChart from '../components/dashboard/LearningJourneyChart';
import ExamMissionCard from '../components/dashboard/ExamMissionCard';
import RecentMissionsStrip, { dedupeRecentMissions } from '../components/dashboard/RecentMissionsStrip';
import TopicDiscovery from '../components/dashboard/TopicDiscovery';
import QuickAccess, { ActionCard, ProfileCard } from '../components/dashboard/QuickAccess';

function firstName(full: string) {
  return full.split(/\s+/)[0] || full;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, role } = useAuthStore(
    useShallow((s) => ({ user: s.user, logout: s.logout, role: s.role }))
  );
  const routes = getRoutesForRole(role);
  const { profile } = useUserStore(useShallow((s) => ({ profile: s.profile })));
  const { currentSession } = useTeachingStore(
    useShallow((s) => ({ currentSession: s.currentSession }))
  );
  const updateMetrics = useAnalyticsStore((s) => s.updateMetrics);
  const insights = useDashboardInsights();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For You');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('7d');

  const learnerName = firstName(displayNameForUser(user));
  const profession = profile?.profession?.name;
  const track = profile?.subProfession || undefined;

  const filteredTopics = useMemo(() => {
    let base: TopicCardModel[] = [];
    if (activeCategory === 'For You') {
      const ranked = [...insights.allTopics].sort((a, b) => {
        const score = (t: TopicCardModel) =>
          (t.inProgress ? 1000 : 0) +
          (t.isNew ? 120 : 0) +
          (t.completed ? -40 : 0) +
          t.totalMinutes +
          (insights.nextTopic?.id === t.id ? 500 : 0);
        return score(b) - score(a);
      });
      base = ranked.slice(0, 8);
    } else {
      base = insights.allTopics.filter(
        (t) =>
          t.subject === activeCategory ||
          t.subjectId === activeCategory.toLowerCase().replace(/\s+/g, '-')
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.grade.toLowerCase().includes(q)
      );
    }
    return base.slice(0, 8);
  }, [activeCategory, searchQuery, insights.allTopics, insights.nextTopic?.id]);

  const recentDeduped = useMemo(
    () => dedupeRecentMissions(insights.recentSessions),
    [insights.recentSessions]
  );

  const weeklySpark = insights.metrics.weeklyHours;

  const handleLogout = async () => {
    await logout();
    redirectAfterSignOut(studentRoutes.modeSelection);
  };

  const handleRefresh = () => {
    if (import.meta.env.DEV) {
      // Long-press alternative: double-tap refresh opens demo roles in DEV
    }
    updateMetrics();
    toast.success('Mission data refreshed');
  };

  const handleStartTopic = (topicId: string) => {
    const learnPath =
      'learn' in routes ? (routes as typeof studentRoutes).learn(topicId) : studentRoutes.learn(topicId);
    navigate(learnPath);
  };

  const homeLearn =
    'learn' in routes
      ? (routes as typeof studentRoutes).learn(
          currentSession?.topicId || insights.nextTopic?.id || 'math-6-1-knowing-numbers'
        )
      : routes.dashboard;

  const heroDescription = profession ? (
    <>
      Tracking your path in{' '}
      <span className="font-semibold" style={{ color: 'var(--dash-text)' }}>
        {profession}
      </span>
      {track && track !== profession ? (
        <>
          {' '}
          · <span style={{ color: 'var(--dash-text-2)' }}>{track}</span>
        </>
      ) : null}
      . Your orbit updates as you study.
    </>
  ) : (
    'Your learning orbit is live — launch a mission and watch progress sync in real time.'
  );

  const strengthSubtitle = !insights.hasActivity
    ? 'Finish a quiz to unlock your strength map.'
    : insights.strength && insights.strength.avgScore > 0
      ? `Top ${insights.peerPercentile}% peer band`
      : insights.strength
        ? `Most studied · ${Math.round(insights.strength.minutes)} min`
        : 'Keep flying to reveal your edge.';

  return (
    <div className="dash-shell relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 10% -10%, var(--dash-brand-glow), transparent), radial-gradient(700px 420px at 90% 0%, var(--dash-brand-soft), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(var(--dash-border) 1px, transparent 1px), linear-gradient(90deg, var(--dash-border) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <DashboardHeader
          homeTo={homeLearn}
          liveNow={insights.liveNow}
          user={user}
          onRefresh={() => {
            handleRefresh();
            if (import.meta.env.DEV && (window as unknown as { __airaRefreshCount?: number })) {
              const w = window as unknown as { __airaRefreshCount?: number };
              w.__airaRefreshCount = (w.__airaRefreshCount || 0) + 1;
              if (w.__airaRefreshCount >= 3) {
                w.__airaRefreshCount = 0;
                navigate('/dev/demo-roles');
              }
            }
          }}
          onProfile={() => navigate(routes.profile)}
          onLogout={handleLogout}
        />

        <main className="flex-1 w-full" id="main-content" tabIndex={-1}>
          <PageTransition className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 pb-20">
            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
              style={{ marginBottom: 'var(--dash-card-gap)' }}
            >
              <div className="lg:col-span-8 min-w-0">
                <HeroCard
                  learnerName={learnerName}
                  readiness={insights.readiness}
                  description={heroDescription}
                  orbitLabel={`${insights.metrics.totalHours}h logged · orbit ${
                    insights.hasActivity ? 'active' : 'standby'
                  }`}
                  stats={[
                    {
                      label: 'Flight time',
                      value: `${insights.metrics.totalHours}h`,
                      tone: 'sky',
                      sparkline: weeklySpark,
                    },
                    {
                      label: 'Accuracy',
                      value: `${insights.metrics.averageQuizScore}%`,
                      tone: 'amber',
                      sparkline: insights.weeklyQuizBars,
                      onClick: () => navigate(routes.profile),
                    },
                    {
                      label: 'Streak',
                      value: `${insights.metrics.streakDays}d`,
                      tone: 'rose',
                      sparkline: weeklySpark.map((h) => (h > 0 ? 1 : 0)),
                    },
                    {
                      label: 'Cleared',
                      value: `${insights.metrics.topicsCompleted}`,
                      tone: 'teal',
                    },
                  ]}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4 min-w-0">
                <SuperStrengthCard
                  subjectName={insights.strength?.name || 'Getting started'}
                  subtitle={strengthSubtitle}
                  progressPct={
                    insights.strength?.avgScore ||
                    Math.min(90, Math.round((insights.strength?.minutes || 0) / 5)) ||
                    12
                  }
                  contextLine="Based on your last practice sessions"
                />
                <NextMissionCard
                  title={insights.nextTopic?.name || insights.focus?.name || 'Pick a mission'}
                  meta={
                    insights.nextTopic
                      ? `${insights.nextTopic.duration} · ${insights.nextTopic.subject}`
                      : 'Open the vault to start your first deep dive'
                  }
                  subjectId={insights.nextTopic?.subjectId || insights.focus?.id || 'mathematics'}
                  difficulty={insights.nextTopic?.difficulty}
                  inProgress={insights.nextTopic?.inProgress}
                  mastery={insights.nextTopic?.mastery}
                  onLaunch={() => {
                    if (insights.nextTopic) handleStartTopic(insights.nextTopic.id);
                    else if ('curriculum' in routes)
                      navigate((routes as { curriculum: string }).curriculum);
                  }}
                />
              </div>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
              style={{ marginBottom: 'var(--dash-section-gap)' }}
            >
              <div className="lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col gap-3 sm:gap-4">
                <LearningJourneyChart
                  points={insights.journeyPoints}
                  growthPct={insights.growthPct}
                  hasActivity={insights.hasActivity}
                  range={range}
                  onRangeChange={setRange}
                />
                {recentDeduped.length > 0 && (
                  <div className="dash-card">
                    <RecentMissionsStrip items={recentDeduped} onOpen={handleStartTopic} />
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 xl:col-span-4 min-w-0">
                <ExamMissionCard
                  readiness={insights.readiness}
                  weeklyScores={insights.weeklyQuizBars}
                  growthPct={insights.growthPct}
                  accuracy={insights.metrics.averageQuizScore}
                  efficiencyMinPerQ={insights.efficiencyMinPerQ}
                  streakDays={insights.metrics.streakDays}
                  topicsCompleted={insights.metrics.topicsCompleted}
                  targetLabel={profession || 'Curriculum mastery'}
                  hasActivity={insights.hasActivity}
                />
              </div>
            </div>

            <TopicDiscovery
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              activeCategory={activeCategory}
              onCategory={setActiveCategory}
              topics={filteredTopics}
              onStart={handleStartTopic}
            />

            <QuickAccess>
              {'modeSelection' in routes && (
                <ActionCard
                  onClick={() => navigate((routes as { modeSelection: string }).modeSelection)}
                  icon={<Sparkles className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} />}
                  title="Learning mode"
                  body="Curriculum or competitive prep"
                />
              )}
              {'curriculum' in routes && (
                <ActionCard
                  onClick={() => navigate((routes as { curriculum: string }).curriculum)}
                  icon={<GraduationCap className="w-4 h-4 text-teal-600" />}
                  title="Study vault"
                  body={`${insights.completedCount} cleared · ${insights.inProgressCount} in flight`}
                />
              )}
              <ActionCard
                onClick={() =>
                  insights.nextTopic
                    ? handleStartTopic(insights.nextTopic.id)
                    : 'curriculum' in routes &&
                      navigate((routes as { curriculum: string }).curriculum)
                }
                icon={<Rocket className="w-4 h-4 text-sky-600" />}
                title="Continue"
                body={insights.nextTopic ? insights.nextTopic.name : 'Launch your next lesson'}
              />
              <ProfileCard
                user={user}
                profession={profession}
                badgeCount={insights.unlockedAchievements.length}
                onClick={() => navigate(routes.profile)}
              />
            </QuickAccess>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
