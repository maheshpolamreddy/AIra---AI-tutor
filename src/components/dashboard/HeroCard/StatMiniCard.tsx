import { motion, useReducedMotion } from 'framer-motion';

type StatMiniCardProps = {
  label: string;
  value: string;
  tone: 'sky' | 'amber' | 'rose' | 'teal';
  sparkline?: number[];
  onClick?: () => void;
  delay?: number;
};

const TONE: Record<StatMiniCardProps['tone'], string> = {
  sky: '#0ea5e9',
  amber: '#f59e0b',
  rose: '#f43f5e',
  teal: '#14b8a6',
};

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const w = 56;
  const h = 16;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="mt-1.5 opacity-80" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export default function StatMiniCard({
  label,
  value,
  tone,
  sparkline,
  onClick,
  delay = 0,
}: StatMiniCardProps) {
  const reduced = useReducedMotion();
  const color = TONE[tone];
  const Comp: typeof motion.button | typeof motion.div = onClick ? motion.button : motion.div;

  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : 0.35 + delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={`rounded-[12px] border text-left px-3 py-2.5 w-full ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: 'var(--dash-surface-1)',
        borderColor: 'var(--dash-border)',
        boxShadow: 'var(--dash-shadow-0)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}
        />
        <span
          className="text-base sm:text-lg font-bold tabular-nums tracking-tight"
          style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
        >
          {value}
        </span>
      </div>
      <p className="dash-eyebrow" style={{ color: 'var(--dash-text-3)' }}>
        {label}
      </p>
      {sparkline && sparkline.length > 1 ? <MiniSpark data={sparkline} color={color} /> : null}
    </Comp>
  );
}
