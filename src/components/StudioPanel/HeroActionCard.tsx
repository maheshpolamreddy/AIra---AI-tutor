import { ArrowRight, FileText, Loader2, Sparkles } from 'lucide-react';
import type { NotesGenerateStatus } from './types';

interface HeroActionCardProps {
    onGenerate: () => void;
    onLearnMore?: () => void;
    status?: NotesGenerateStatus;
    generatedCount?: number;
    compact?: boolean;
}

function statusLabel(status: NotesGenerateStatus, generatedCount: number): string {
    if (status === 'processing') return 'Processing…';
    if (status === 'generated' || generatedCount > 0) {
        return generatedCount === 1 ? '1 set generated' : `${generatedCount} sets generated`;
    }
    return 'Ready to generate';
}

export function HeroActionCard({
    onGenerate,
    onLearnMore,
    status = 'ready',
    generatedCount = 0,
    compact,
}: HeroActionCardProps) {
    const busy = status === 'processing';
    const label = statusLabel(status, generatedCount);

    return (
        <section
            className={`group/action relative flex shrink-0 flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--teaching-accent)_28%,var(--teaching-panel-divider))] shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                compact ? 'p-3.5' : 'p-5'
            }`}
            style={{
                background:
                    'linear-gradient(145deg, color-mix(in srgb, var(--teaching-accent) 14%, var(--teaching-panel-bg)), var(--teaching-panel-bg))',
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex shrink-0 items-center justify-center rounded-lg ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--teaching-accent) 18%, var(--teaching-panel-bg))',
                    }}
                >
                    <FileText className={`text-[var(--teaching-accent)] ${compact ? 'h-5 w-5' : 'h-6 w-6'}`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`font-semibold text-[var(--teaching-panel-text)] ${compact ? 'text-[14px]' : 'text-[16px]'}`}>
                        Generate Detailed Notes
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--teaching-panel-text-muted)] sm:text-[13px]">
                        Let AI create comprehensive study notes as you learn this topic.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--teaching-panel-text-muted)]">
                <span
                    className={`inline-block h-2 w-2 rounded-full ${
                        busy
                            ? 'animate-pulse bg-amber-400'
                            : generatedCount > 0
                              ? 'bg-emerald-500'
                              : 'bg-[var(--teaching-accent)]'
                    }`}
                    aria-hidden
                />
                <span>{label}</span>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={busy}
                    className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[var(--teaching-accent)] px-4 text-[13px] font-semibold text-white outline-none transition-all duration-150 hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--teaching-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--teaching-panel-bg)]"
                >
                    {busy ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Generating…
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" aria-hidden />
                            Generate now
                            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                        </>
                    )}
                </button>
                {onLearnMore && (
                    <button
                        type="button"
                        onClick={onLearnMore}
                        className="min-h-[40px] self-start px-1 text-[12px] font-semibold text-[var(--teaching-accent)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--teaching-accent)] focus-visible:ring-offset-2"
                    >
                        Learn more
                    </button>
                )}
            </div>
        </section>
    );
}
