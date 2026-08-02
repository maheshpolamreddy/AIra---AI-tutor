import { ChevronRight } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

type NextMissionCardProps = {
  title: string;
  meta: string;
  subjectId?: string;
  difficulty?: string;
  inProgress?: boolean;
  mastery?: number;
  onLaunch: () => void;
};

export default function NextMissionCard({
  title,
  meta,
  subjectId = 'english',
  difficulty,
  inProgress,
  mastery = 0,
  onLaunch,
}: NextMissionCardProps) {
  const Icon = subjectIcon(subjectId);
  const color = subjectHex(subjectId);

  return (
    <div className="dash-card flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(244,63,94,0.1)' }}
        >
          <span className="w-4 h-4 rounded-full border-2 border-rose-500 relative">
            <span className="absolute inset-1 rounded-full bg-rose-500/40" />
          </span>
        </div>
        <span className="dash-eyebrow">Next mission</span>
      </div>

      <div className="flex items-start gap-3 mt-1">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3
            className="leading-snug"
            style={{
              fontFamily: 'var(--dash-font-display)',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--dash-text)',
            }}
          >
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--dash-text-2)' }}>
            {meta}
            {difficulty ? ` · ${difficulty}` : ''}
          </p>
          {inProgress && mastery > 0 ? (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--dash-surface-2)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, mastery)}%`,
                  background: 'linear-gradient(90deg, var(--dash-brand-2), var(--dash-brand))',
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onLaunch}
        className="mt-auto pt-4 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-semibold transition-all group"
        style={{
          background: 'var(--dash-surface-ink)',
          color: 'var(--dash-text-inv)',
          transitionDuration: 'var(--dash-hover-ms)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.filter = 'brightness(1.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.filter = '';
        }}
      >
        Launch mission
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
