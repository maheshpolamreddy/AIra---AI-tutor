import { subjectHex, subjectIcon } from './theme/subjectColors';

export type RecentMissionItem = {
  key: string;
  topicId: string;
  topicName: string;
  subject: string;
  durationMinutes: number;
  completionPercentage: number;
  attempts?: number;
};

type RecentMissionsStripProps = {
  items: RecentMissionItem[];
  onOpen: (topicId: string) => void;
};

/** Deduplicate consecutive same-topic entries into attempt counts. */
export function dedupeRecentMissions(
  sessions: Array<{
    sessionId: string;
    topicId: string;
    topicName: string;
    subject: string;
    durationMinutes: number;
    completionPercentage: number;
  }>
): RecentMissionItem[] {
  const out: RecentMissionItem[] = [];
  for (const s of sessions) {
    const last = out[out.length - 1];
    if (last && last.topicId === s.topicId) {
      last.attempts = (last.attempts || 1) + 1;
      last.durationMinutes += s.durationMinutes;
      last.completionPercentage = Math.max(last.completionPercentage, s.completionPercentage);
      continue;
    }
    out.push({
      key: s.sessionId,
      topicId: s.topicId,
      topicName: s.topicName,
      subject: s.subject,
      durationMinutes: s.durationMinutes,
      completionPercentage: s.completionPercentage,
      attempts: 1,
    });
  }
  return out;
}

export default function RecentMissionsStrip({ items, onOpen }: RecentMissionsStripProps) {
  if (!items.length) return null;

  return (
    <div>
      <p className="dash-eyebrow mb-2.5">Recent missions</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-0.5 px-0.5">
        {items.map((s) => {
          const Icon = subjectIcon(s.subject);
          const color = subjectHex(s.subject);
          const title =
            (s.attempts || 1) > 1 ? `${s.topicName} (${s.attempts} attempts)` : s.topicName;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onOpen(s.topicId)}
              className="dash-card--interactive shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left"
              style={{
                background: 'var(--dash-surface-1)',
                borderColor: 'var(--dash-border)',
                transitionDuration: 'var(--dash-hover-ms)',
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center border"
                style={{
                  background: 'var(--dash-surface-0)',
                  borderColor: 'var(--dash-border)',
                  color,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0">
                <span
                  className="block text-xs font-semibold truncate max-w-[8.5rem]"
                  style={{ color: 'var(--dash-text)' }}
                >
                  {title}
                </span>
                <span className="block text-[10px]" style={{ color: 'var(--dash-text-3)' }}>
                  {s.durationMinutes} min · {s.completionPercentage}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
