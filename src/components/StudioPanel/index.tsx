import { FeaturedToolCard } from './FeaturedToolCard';
import { HeroActionCard } from './HeroActionCard';
import { ToolCard } from './ToolCard';
import type { StudioPanelProps, ToolItem } from './types';

export type {
    FeaturedToolItem,
    NotesGenerateStatus,
    StudioPanelProps,
    StudioToolBadge,
    StudioToolId,
    ToolItem,
} from './types';

export default function StudioPanel({
    tools,
    featuredTool,
    activeToolId,
    onToolClick,
    onGenerateNotes,
    onFeaturedCta,
    onLearnMoreNotes,
    notesStatus = 'ready',
    notesGeneratedCount = 0,
    wide = false,
    className = '',
}: StudioPanelProps) {
    const compact = !wide;
    const withoutFeatured: ToolItem[] = featuredTool
        ? tools.filter((t) => t.id !== featuredTool.id)
        : tools;

    // Wide (maximized): 2×2 core + full-width overflow. Compact (narrow rail): single column.
    const coreGrid = withoutFeatured.slice(0, 4);
    const overflowTools = withoutFeatured.slice(4);

    return (
        <div
            className={`studio-panel flex h-full min-h-0 flex-col ${className}`}
            role="region"
            aria-label="Studio tools"
            data-layout={wide ? 'wide' : 'compact'}
        >
            <div className="studio-panel-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
                {featuredTool && (
                    <FeaturedToolCard
                        tool={featuredTool}
                        compact={compact}
                        onClick={() => onToolClick(featuredTool.id)}
                        onCta={onFeaturedCta || (() => onToolClick(featuredTool.id))}
                    />
                )}

                <div>
                    <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.8px] text-[var(--teaching-panel-text-muted)]">
                        Core tools
                    </p>
                    <div
                        className={`grid gap-2.5 ${
                            wide ? 'grid-cols-2 sm:gap-3' : 'grid-cols-1'
                        }`}
                    >
                        {coreGrid.map((tool) => (
                            <ToolCard
                                key={tool.id}
                                tool={tool}
                                compact={compact}
                                isActive={activeToolId === tool.id}
                                onClick={() => onToolClick(tool.id)}
                            />
                        ))}
                        {overflowTools.map((tool) => (
                            <ToolCard
                                key={tool.id}
                                tool={tool}
                                compact={compact}
                                fullWidth
                                isActive={activeToolId === tool.id}
                                onClick={() => onToolClick(tool.id)}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-auto shrink-0 pt-1">
                    <HeroActionCard
                        compact={compact}
                        onGenerate={onGenerateNotes}
                        status={notesStatus}
                        generatedCount={notesGeneratedCount}
                        onLearnMore={onLearnMoreNotes}
                    />
                </div>
            </div>
        </div>
    );
}
