import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Flame, CheckCircle2 } from 'lucide-react';

type ExamMissionCardProps = {
  readiness: number;
  weeklyScores: number[];
  growthPct: number;
  accuracy: number;
  efficiencyMinPerQ: number;
  streakDays: number;
  topicsCompleted: number;
  targetLabel?: string;
  hasActivity: boolean;
};

export default function ExamMissionCard({
  readiness,
  weeklyScores,
  growthPct,
  accuracy,
  efficiencyMinPerQ,
  streakDays,
  topicsCompleted,
  targetLabel = 'Curriculum mastery',
  hasActivity,
}: ExamMissionCardProps) {
  const reduced = useReducedMotion();
  const bars = weeklyScores.length === 7 ? weeklyScores : [0, 0, 0, 0, 0, 0, 0];
  const dayLabels = (() => {
    const labels: string[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      labels.push(i === 0 ? 'Now' : d.toLocaleDateString(undefined, { weekday: 'narrow' }));
    }
    return labels;
  })();
  const tier =
    readiness >= 85 ? 'Elite' : readiness >= 65 ? 'Rising' : readiness >= 35 ? 'Building' : 'Start';
  const r = 32;
  const circ = 2 * Math.PI * r;

  return (
    <div className="dash-card h-full flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--dash-brand-soft)' }}
          >
            <Target className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
              Exam mission
            </h2>
            <p className="text-[11px] truncate" style={{ color: 'var(--dash-text-3)' }}>
              {targetLabel}
            </p>
          </div>
        </div>
        <div
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold tabular-nums"
          style={{ color: growthPct >= 0 ? '#059669' : '#e11d48' }}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${growthPct < 0 ? 'rotate-180' : ''}`} />
          {growthPct >= 0 ? '+' : ''}
          {growthPct}%
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="var(--dash-border-strong)"
              strokeWidth="8"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="url(#examReadyGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - Math.max(0.04, readiness / 100)) }}
              transition={{ duration: reduced ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="examReadyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-base sm:text-lg font-bold tabular-nums leading-none" style={{ color: 'var(--dash-text)' }}>
              {readiness}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
              {tier}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="h-[56px] sm:h-16 flex items-end gap-1">
            {bars.map((score, i) => {
              const isNow = i === bars.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <motion.div
                    className="w-full rounded-md"
                    style={{
                      background: isNow
                        ? 'linear-gradient(to top, #4f46e5, #0ea5e9)'
                        : 'linear-gradient(to top, rgba(79,70,229,0.45), rgba(14,165,233,0.45))',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(8, score)}%` }}
                    transition={{ delay: reduced ? 0 : 0.05 * i, type: 'spring', stiffness: 140, damping: 16 }}
                    title={`${score}%`}
                  />
                  <span className="text-[9px] font-medium" style={{ color: isNow ? 'var(--dash-brand)' : 'var(--dash-text-3)' }}>
                    {dayLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
          {!hasActivity && (
            <p className="text-[11px] mt-2" style={{ color: 'var(--dash-text-3)' }}>
              Complete a lesson to calibrate readiness.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-auto">
        <MiniStat icon={<Clock className="w-3 h-3" />} label="Pace" value={efficiencyMinPerQ > 0 ? `${efficiencyMinPerQ}` : '—'} unit="min" />
        <MiniStat icon={<Zap className="w-3 h-3" />} label="Accuracy" value={`${accuracy}`} unit="%" />
        <MiniStat icon={<Flame className="w-3 h-3" />} label="Streak" value={`${streakDays}`} unit="d" />
        <MiniStat icon={<CheckCircle2 className="w-3 h-3" />} label="Cleared" value={`${topicsCompleted}`} unit="" />
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div
      className="rounded-xl px-2.5 py-2 border"
      style={{ background: 'var(--dash-surface-1)', borderColor: 'var(--dash-border)' }}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--dash-text-3)' }}>
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--dash-text)' }}>
        {value}
        {unit ? <span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--dash-text-3)' }}>{unit}</span> : null}
      </p>
    </div>
  );
}
