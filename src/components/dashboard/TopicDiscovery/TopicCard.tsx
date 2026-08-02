import { motion } from 'framer-motion';
import { Clock, Play, CheckCircle2 } from 'lucide-react';
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
    ? { label: 'Cleared', bg: 'rgba(16,185,129,0.12)', fg: '#059669' }
    : topic.inProgress
      ? { label: 'In flight', bg: 'rgba(14,165,233,0.12)', fg: '#0284c7' }
      : topic.isNew
        ? { label: 'New', bg: 'var(--dash-brand-soft)', fg: 'var(--dash-brand)' }
        : { label: 'Ready', bg: 'var(--dash-surface-2)', fg: 'var(--dash-text-3)' };

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.02 }}
      onClick={onStart}
      className="group text-left dash-card dash-card--interactive p-3.5 sm:p-4"
      style={{ ['--hover-accent' as string]: color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--dash-border)';
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <span
          className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[9px] font-bold uppercase"
          style={{ background: status.bg, color: status.fg }}
        >
          {topic.completed ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
          {status.label}
        </span>
      </div>

      <h3
        className="leading-snug line-clamp-2 transition-colors"
        style={{
          fontSize: 'var(--dash-card-title)',
          fontWeight: 600,
          color: 'var(--dash-text)',
        }}
      >
        {topic.name}
      </h3>
      <p className="mt-1 dash-eyebrow">{topic.subject}</p>

      {topic.mastery > 0 && (
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'var(--dash-surface-2)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, topic.mastery)}%`,
              background: `linear-gradient(90deg, ${color}, var(--dash-brand))`,
            }}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--dash-text-2)' }}>
            <Clock className="w-3 h-3" />
            {topic.duration}
          </span>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
            style={{
              background:
                topic.difficulty === 'beginner'
                  ? 'rgba(16,185,129,0.12)'
                  : topic.difficulty === 'intermediate'
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(244,63,94,0.12)',
              color:
                topic.difficulty === 'beginner'
                  ? '#059669'
                  : topic.difficulty === 'intermediate'
                    ? '#d97706'
                    : '#e11d48',
            }}
          >
            {topic.difficulty}
          </span>
        </div>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--dash-surface-2)', color: 'var(--dash-text-2)' }}
        >
          <Play className="w-3 h-3 ml-0.5 group-hover:text-white" />
        </span>
      </div>
    </motion.button>
  );
}
