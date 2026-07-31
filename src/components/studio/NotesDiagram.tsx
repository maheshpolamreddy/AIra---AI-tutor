import type { NoteDiagram, NoteDiagramNode } from '../../types';

interface NotesDiagramProps {
    diagram: NoteDiagram;
}

const ACCENT = '#7C3AED';
const ACCENT_SOFT = '#EDE9FE';
const ACCENT_MID = '#C4B5FD';
const INK = '#1E293B';
const MUTED = '#64748B';
const CARD = '#FFFFFF';
const EDGE = '#94A3B8';

function truncate(label: string, max = 42): string {
    const t = label.trim();
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function NodePill({
    x,
    y,
    w,
    h,
    node,
    fill = ACCENT_SOFT,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    node: NoteDiagramNode;
    fill?: string;
}) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={12}
                fill={fill}
                stroke={ACCENT_MID}
                strokeWidth={1.5}
            />
            <text
                x={x + w / 2}
                y={y + (node.detail ? h / 2 - 4 : h / 2 + 4)}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill={INK}
            >
                {truncate(node.label, Math.floor(w / 7))}
            </text>
            {node.detail ? (
                <text
                    x={x + w / 2}
                    y={y + h / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill={MUTED}
                >
                    {truncate(node.detail, Math.floor(w / 6))}
                </text>
            ) : null}
        </g>
    );
}

function Arrow({
    x1,
    y1,
    x2,
    y2,
    label,
    markerId,
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
    markerId: string;
}) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    return (
        <g>
            <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill={EDGE} />
                </marker>
            </defs>
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={EDGE}
                strokeWidth={2}
                markerEnd={`url(#${markerId})`}
            />
            {label ? (
                <text x={midX} y={midY - 6} textAnchor="middle" fontSize={9} fill={MUTED} fontWeight={600}>
                    {truncate(label, 24)}
                </text>
            ) : null}
        </g>
    );
}

function ProcessDiagram({ nodes, edges }: { nodes: NoteDiagramNode[]; edges?: NoteDiagram['edges'] }) {
    const n = Math.max(nodes.length, 1);
    const boxW = 130;
    const boxH = 56;
    const gap = 36;
    const width = Math.max(320, n * boxW + (n - 1) * gap + 40);
    const height = 120;
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
            {nodes.map((node, i) => {
                const x = 20 + i * (boxW + gap);
                const y = 32;
                return (
                    <g key={node.id || i}>
                        {i < n - 1 ? (
                            <Arrow
                                markerId={`notes-arrow-process-${i}`}
                                x1={x + boxW}
                                y1={y + boxH / 2}
                                x2={x + boxW + gap}
                                y2={y + boxH / 2}
                                label={edges?.find(e => e.from === node.id)?.label}
                            />
                        ) : null}
                        <NodePill x={x} y={y} w={boxW} h={boxH} node={node} />
                    </g>
                );
            })}
        </svg>
    );
}

function HierarchyDiagram({ nodes }: { nodes: NoteDiagramNode[] }) {
    const root = nodes[0];
    const children = nodes.slice(1);
    const boxW = 140;
    const boxH = 52;
    const gap = 16;
    const width = Math.max(360, children.length * (boxW + gap) + 40);
    const height = 180;
    const rootX = width / 2 - boxW / 2;
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
            {root ? <NodePill x={rootX} y={16} w={boxW} h={boxH} node={root} fill="#DDD6FE" /> : null}
            {children.map((child, i) => {
                const x = 20 + i * (boxW + gap);
                const y = 110;
                const childCenter = x + boxW / 2;
                return (
                    <g key={child.id || i}>
                        <line
                            x1={width / 2}
                            y1={16 + boxH}
                            x2={childCenter}
                            y2={y}
                            stroke={EDGE}
                            strokeWidth={2}
                        />
                        <NodePill x={x} y={y} w={boxW} h={boxH} node={child} />
                    </g>
                );
            })}
        </svg>
    );
}

function CycleDiagram({ nodes }: { nodes: NoteDiagramNode[] }) {
    const n = Math.max(nodes.length, 1);
    const cx = 180;
    const cy = 140;
    const r = 90;
    const boxW = 110;
    const boxH = 48;
    return (
        <svg viewBox="0 0 360 280" className="w-full h-auto max-w-md mx-auto" role="img">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={ACCENT_MID} strokeWidth={2} strokeDasharray="6 6" />
            {nodes.map((node, i) => {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                const x = cx + Math.cos(angle) * r - boxW / 2;
                const y = cy + Math.sin(angle) * r - boxH / 2;
                return <NodePill key={node.id || i} x={x} y={y} w={boxW} h={boxH} node={node} />;
            })}
        </svg>
    );
}

function CompareDiagram({ nodes }: { nodes: NoteDiagramNode[] }) {
    const left = nodes.filter((_, i) => i % 2 === 0);
    const right = nodes.filter((_, i) => i % 2 === 1);
    const rows = Math.max(left.length, right.length, 1);
    const boxW = 150;
    const boxH = 52;
    const width = 360;
    const height = 40 + rows * 68;
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-md mx-auto" role="img">
            <text x={95} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
                Side A
            </text>
            <text x={265} y={22} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT}>
                Side B
            </text>
            {Array.from({ length: rows }).map((_, i) => (
                <g key={i}>
                    {left[i] ? <NodePill x={20} y={36 + i * 68} w={boxW} h={boxH} node={left[i]} /> : null}
                    {right[i] ? <NodePill x={190} y={36 + i * 68} w={boxW} h={boxH} node={right[i]} /> : null}
                    {left[i] && right[i] ? (
                        <line
                            x1={170}
                            y1={36 + i * 68 + boxH / 2}
                            x2={190}
                            y2={36 + i * 68 + boxH / 2}
                            stroke={EDGE}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
                    ) : null}
                </g>
            ))}
        </svg>
    );
}

function ConceptMapDiagram({ nodes, edges }: { nodes: NoteDiagramNode[]; edges?: NoteDiagram['edges'] }) {
    const n = Math.max(nodes.length, 1);
    const cx = 220;
    const cy = 150;
    const r = n <= 1 ? 0 : 100;
    const boxW = 120;
    const boxH = 48;
    const positions = nodes.map((node, i) => {
        if (i === 0) return { node, x: cx - boxW / 2, y: cy - boxH / 2 };
        const angle = (Math.PI * 2 * (i - 1)) / Math.max(n - 1, 1) - Math.PI / 2;
        return {
            node,
            x: cx + Math.cos(angle) * r - boxW / 2,
            y: cy + Math.sin(angle) * r - boxH / 2,
        };
    });
    const byId = Object.fromEntries(positions.map(p => [p.node.id, p]));
    return (
        <svg viewBox="0 0 440 300" className="w-full h-auto" role="img">
            {(edges || []).map((edge, i) => {
                const a = byId[edge.from];
                const b = byId[edge.to];
                if (!a || !b) return null;
                return (
                    <Arrow
                        key={`${edge.from}-${edge.to}-${i}`}
                        markerId={`notes-arrow-map-${i}`}
                        x1={a.x + boxW / 2}
                        y1={a.y + boxH / 2}
                        x2={b.x + boxW / 2}
                        y2={b.y + boxH / 2}
                        label={edge.label}
                    />
                );
            })}
            {positions.map(({ node, x, y }, i) => (
                <NodePill
                    key={node.id || i}
                    x={x}
                    y={y}
                    w={boxW}
                    h={boxH}
                    node={node}
                    fill={i === 0 ? '#DDD6FE' : ACCENT_SOFT}
                />
            ))}
        </svg>
    );
}

export function NotesDiagram({ diagram }: NotesDiagramProps) {
    const nodes = (diagram.nodes || []).filter(n => n && n.label?.trim()).slice(0, 8);
    if (nodes.length === 0) return null;

    const body = (() => {
        switch (diagram.type) {
            case 'hierarchy':
                return <HierarchyDiagram nodes={nodes} />;
            case 'cycle':
                return <CycleDiagram nodes={nodes} />;
            case 'compare':
                return <CompareDiagram nodes={nodes} />;
            case 'concept-map':
                return <ConceptMapDiagram nodes={nodes} edges={diagram.edges} />;
            case 'process':
            default:
                return <ProcessDiagram nodes={nodes} edges={diagram.edges} />;
        }
    })();

    return (
        <figure
            className="my-4 overflow-hidden rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
            style={{ backgroundColor: CARD }}
        >
            <figcaption className="px-4 pt-3 pb-1 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200 text-[10px] font-black uppercase tracking-wide">
                    Fig
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{diagram.title}</span>
            </figcaption>
            <div className="px-3 pb-2">{body}</div>
            {diagram.caption ? (
                <p className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{diagram.caption}</p>
            ) : null}
        </figure>
    );
}

export default NotesDiagram;
