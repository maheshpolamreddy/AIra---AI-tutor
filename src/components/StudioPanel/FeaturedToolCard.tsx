import { ArrowRight } from 'lucide-react';
import type { FeaturedToolItem } from './types';
import { ToolBadge } from './ToolBadge';

interface FeaturedToolCardProps {
    tool: FeaturedToolItem;
    onClick: () => void;
    onCta?: () => void;
    compact?: boolean;
}

export function FeaturedToolCard({ tool, onClick, onCta, compact }: FeaturedToolCardProps) {
    const Icon = tool.icon;
    const total = tool.progressTotal ?? 0;
    const current = Math.min(tool.progressCurrent ?? 0, total);
    // Only a real, loaded question set produces a progress bar — never a placeholder total.
    const hasProgress = total > 0;
    const pct = hasProgress ? Math.min(100, Math.round((current / total) * 100)) : 0;
    const ctaLabel = tool.ctaLabel || 'Start quiz';

    return (
        <section
            className={`studio-featured-card relative grid shrink-0 gap-3 rounded-xl border ${
                compact ? 'p-3.5' : 'p-5'
            }`}
            style={{
                borderColor: `color-mix(in srgb, ${tool.accentColor} 30%, var(--teaching-panel-divider))`,
                background: `linear-gradient(145deg, color-mix(in srgb, ${tool.accentColor} 12%, var(--teaching-panel-bg)), var(--teaching-panel-bg))`,
            }}
        >
            <div className={`flex items-start gap-3 ${compact ? '' : 'pr-2'}`}>
                <div
                    className={`flex shrink-0 items-center justify-center rounded-xl shadow-sm ${
                        compact ? 'h-11 w-11' : 'h-14 w-14'
                    }`}
                    style={{
                        backgroundColor: 'color-mix(in srgb, #8B5CF6 16%, var(--teaching-panel-bg))',
                    }}
                >
                    <Icon
                        className={compact ? 'h-5 w-5' : 'h-7 w-7'}
                        style={{ color: tool.accentColor }}
                        aria-hidden
                        strokeWidth={2.1}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3
                            className={`font-semibold leading-tight text-[var(--teaching-panel-text)] ${
                                compact ? 'text-[15px]' : 'text-[18px]'
                            }`}
                        >
                            {tool.title}
                        </h3>
                        {tool.badge && <ToolBadge badge={tool.badge} />}
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-[var(--teaching-panel-text-muted)] sm:text-[13px]">
                        {tool.description || 'Practice what you just learned'}
                    </p>
                </div>
            </div>

            {hasProgress ? (
                <div aria-label={`Progress ${current} of ${total} questions`}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--teaching-panel-text-muted)]">
                        <span>Questions answered</span>
                        <span className="tabular-nums">
                            {current}/{total}
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div
                            className="studio-progress-fill h-full rounded-full motion-reduce:transition-none"
                            style={{
                                width: `${pct}%`,
                                backgroundColor: tool.accentColor,
                            }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-[11px] font-medium text-[var(--teaching-panel-text-muted)]">
                    {tool.statusLabel || 'Not started yet'}
                </p>
            )}

            <div className={`flex gap-2 ${compact ? 'flex-col' : 'flex-row'}`}>
                <button
                    type="button"
                    onClick={onCta || onClick}
                    className="group inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-white outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--teaching-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--teaching-panel-bg)]"
                    style={{ backgroundColor: tool.accentColor }}
                >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                </button>
                {!compact && (
                    <button
                        type="button"
                        onClick={onClick}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--teaching-panel-divider)] bg-[var(--teaching-panel-bg)] px-3 text-[12px] font-semibold text-[var(--teaching-panel-text)] outline-none transition-colors hover:bg-[var(--teaching-panel-bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--teaching-accent)] focus-visible:ring-offset-2"
                        aria-label={`Open ${tool.title}`}
                    >
                        Open
                    </button>
                )}
            </div>
        </section>
    );
}
