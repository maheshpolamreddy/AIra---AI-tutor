import { motion, useReducedMotion } from 'framer-motion';
import { Zap } from 'lucide-react';

type SuperStrengthCardProps = {
  subjectName: string;
  subtitle: string;
  progressPct: number;
  contextLine?: string;
};

export default function SuperStrengthCard({
  subjectName,
  subtitle,
  progressPct,
  contextLine = 'Based on your recent practice sessions',
}: SuperStrengthCardProps) {
  const reduced = useReducedMotion();
  const pct = Math.max(8, Math.min(100, progressPct));

  return (
    <div
      className="relative overflow-hidden rounded-[var(--dash-radius-lg)] p-4 sm:p-5 flex-1 text-white"
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 48%, #0f172a 100%)',
        boxShadow: 'var(--dash-shadow-3)',
      }}
    >
      {/* Subtle star field */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #fff, transparent)',
          backgroundSize: '100% 100%',
        }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.25), transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              boxShadow: '0 0 16px rgba(251,191,36,0.35)',
            }}
          >
            <Zap className="w-4 h-4 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }} />
          </div>
          <span className="dash-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Super strength
          </span>
        </div>
        <h3
          className="tracking-tight"
          style={{ fontFamily: 'var(--dash-font-display)', fontSize: '1.25rem', fontWeight: 700 }}
        >
          {subjectName}
        </h3>
        <p className="mt-1.5 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {subtitle}
        </p>
        <p className="mt-1 text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {contextLine}
        </p>
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #38bdf8, #2dd4bf)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
