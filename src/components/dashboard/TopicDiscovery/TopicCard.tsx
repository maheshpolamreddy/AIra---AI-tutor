import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { subjectHex, subjectIcon } from '../theme/subjectColors';
import type { TopicCardModel } from '../../../hooks/useDashboardInsights';

type TopicCardProps = {
  topic: TopicCardModel;
  index: number;
  onStart: () => void;
};

export default function TopicCard({ topic, index, onStart }: TopicCardProps) {
  const Icon = subjectIcon(topic.subjectId);
  const color = subjectHex(topic.subjectId);

  const status = topic.completed
    ? { label: 'Completed', bg: 'rgba(16,185,129,0.14)', fg: '#059669' }
    : topic.inProgress
      ? { label: 'In progress', bg: 'rgba(14,165,233,0.14)', fg: '#0284c7' }
      : topic.isNew
        ? { label: 'New', bg: 'var(--dash-brand-soft)', fg: 'var(--dash-brand)' }
        : { label: 'Available', bg: 'var(--dash-surface-2)', fg: 'var(--dash-text-3)' };

  const difficultyStyle =
    topic.difficulty === 'beginner'
      ? { bg: 'rgba(16,185,129,0.12)', fg: '#059669' }
      : topic.difficulty === 'intermediate'
        ? { bg: 'rgba(245,158,11,0.12)', fg: '#d97706' }
        : { bg: 'rgba(244,63,94,0.12)', fg: '#e11d48' };

  const cta = topic.inProgress ? 'Continue' : topic.completed ? 'Review' : 'Start';

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ delay: Math.min(index * 0.03, 0.24), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onStart}
      className="group relative text-left flex flex-col h-full min-h-[196px] sm:min-h-[208px] rounded-[18px] border p-4 sm:p-5 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: `linear-gradient(165deg, ${color}14 0%, #ffffff 36%, var(--dash-surface-0) 100%)`,
        borderColor: `${color}24`,
        boxShadow: 'var(--dash-shadow-1)',
        outlineColor: color,
      }}
    >
      <div
        className="absolute top-0 inset-x-0 h-[3px] opacity-90"
        style={{ background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 40%, #0ea5e9))` }}
      />
      <div
        className="absolute -top-14 -right-12 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}22, transparent 68%)` }}
      />

      <div className="relative flex items-start justify-between gap-3 mb-3.5">
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(145deg, ${color}28, ${color}10)`,
            color,
            boxShadow: `0 8px 18px ${color}1f`,
          }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <span
          className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide"
          style={{ background: status.bg, color: status.fg }}
        >
          {topic.completed ? <CheckCircle2 className="w-3 h-3" /> : null}
          {status.label}
        </span>
      </div>

      <div className="relative flex-1 min-w-0">
        <h3
          className="leading-snug line-clamp-2"
          style={{
            fontFamily: 'var(--dash-font-display)',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: 'var(--dash-text)',
            letterSpacing: '-0.015em',
          }}
        >
          {topic.name}
        </h3>
        <p
          className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--dash-text-3)' }}
        >
          {topic.subject}
        </p>

        {topic.mastery > 0 ? (
          <div className="mt-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--dash-text-3)' }}>
                Progress
              </span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--dash-text-2)' }}>
                {Math.min(100, topic.mastery)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dash-surface-2)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, topic.mastery)}%`,
                  background: `linear-gradient(90deg, ${color}, #0ea5e9)`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3.5" />
        )}
      </div>

      <div
        className="relative mt-4 pt-3.5 flex items-center justify-between gap-2 border-t"
        style={{ borderColor: 'var(--dash-border)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span
            className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] font-semibold"
            style={{ background: 'var(--dash-surface-1)', color: 'var(--dash-text-2)' }}
          >
            <Clock className="w-3 h-3" />
            {topic.duration}
          </span>
          <span
            className="h-6 px-2 rounded-lg text-[10px] font-bold uppercase inline-flex items-center"
            style={{ background: difficultyStyle.bg, color: difficultyStyle.fg }}
          >
            {topic.difficulty}
          </span>
        </div>
        <span
          className="shrink-0 inline-flex items-center gap-1 h-7 pl-2.5 pr-2 rounded-lg text-[11px] font-bold transition-colors"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
        >
          {cta}
          <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}
