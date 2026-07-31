import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowRight,
  Award,
  Zap,
  Sparkles,
  Star,
  Check,
} from 'lucide-react';
import { studentRoutes } from '../utils/routes';
import PageTransition from '../components/common/PageTransition';
import AiraLogo from '../components/brand/AiraLogo';
import { useSettingsStore } from '../stores/settingsStore';
import { writeStudentHomeHint } from '../lib/sessionHints';

type ModeAccent = 'curriculum' | 'competitive';

interface ModeCardProps {
  title: string;
  icon: React.ReactNode;
  accent: ModeAccent;
  badge: string;
  onSelect: () => void;
  isSelecting: boolean;
  delay: number;
  reduceMotion: boolean;
}

const accentTokens: Record<
  ModeAccent,
  {
    text: string;
    bar: string;
    barHover: string;
    iconGradient: string;
    iconGlow: string;
    arrowHover: string;
    focusRing: string;
    badge: string;
    check: string;
    pulse: string;
  }
> = {
  curriculum: {
    text: 'text-[var(--color-curriculum)] dark:text-emerald-300',
    bar: 'bg-[var(--color-curriculum)]',
    barHover: 'group-hover:w-[5px]',
    iconGradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    iconGlow: 'shadow-emerald-500/30',
    arrowHover:
      'group-hover:bg-[var(--color-curriculum)] group-hover:border-[var(--color-curriculum)] group-hover:text-white',
    focusRing:
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-curriculum)]',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    check: 'bg-[var(--color-curriculum)]',
    pulse: 'bg-emerald-500',
  },
  competitive: {
    text: 'text-[var(--color-competitive)] dark:text-amber-300',
    bar: 'bg-[var(--color-competitive)]',
    barHover: 'group-hover:w-[5px]',
    iconGradient: 'from-amber-400 via-amber-500 to-orange-600',
    iconGlow: 'shadow-amber-500/30',
    arrowHover:
      'group-hover:bg-[var(--color-competitive)] group-hover:border-[var(--color-competitive)] group-hover:text-white',
    focusRing:
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-competitive)]',
    badge:
      'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    check: 'bg-[var(--color-competitive)]',
    pulse: 'bg-amber-500',
  },
};

function ModeCard({
  title,
  icon,
  accent,
  badge,
  onSelect,
  isSelecting,
  delay,
  reduceMotion,
}: ModeCardProps) {
  const tokens = accentTokens[accent];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={isSelecting}
      aria-label={`Enter ${title}`}
      aria-busy={isSelecting}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
      className={`
        group relative w-full min-h-[48px] text-left
        rounded-2xl sm:rounded-[20px]
        pl-5 pr-4 py-4 sm:pl-6 sm:pr-5 sm:py-[18px]
        bg-[var(--color-surface-elevated)]
        border border-[var(--color-border-subtle)]
        shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.35)]
        transition-[transform,box-shadow] duration-150 ease-out
        hover:-translate-y-0.5
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_14px_32px_rgba(0,0,0,0.1)]
        dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_14px_32px_rgba(0,0,0,0.45)]
        ${tokens.focusRing}
        disabled:cursor-wait
        overflow-hidden
      `}
    >
      {/* Left accent bar */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${tokens.bar} ${tokens.barHover} transition-[width] duration-150 ease-out rounded-l-2xl`}
        aria-hidden
      />

      <span
        className={`absolute top-3.5 right-3.5 z-20 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${tokens.badge}`}
      >
        {badge}
      </span>

      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        <div
          className={`
            relative flex-shrink-0
            h-14 w-14 sm:h-16 sm:w-16
            rounded-[14px] sm:rounded-2xl
            bg-gradient-to-br ${tokens.iconGradient}
            flex items-center justify-center text-white
            shadow-lg ${tokens.iconGlow}
            overflow-hidden
          `}
        >
          {/* Glossy highlight */}
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/5 to-transparent"
            aria-hidden
          />
          <span className="relative z-10 drop-shadow-sm">{icon}</span>
        </div>

        <h3
          className={`flex-1 min-w-0 font-display text-[22px] sm:text-2xl font-semibold tracking-[-0.02em] leading-tight pr-16 ${tokens.text} dark:text-white`}
        >
          {title}
        </h3>

        <div
          className={`
            flex-shrink-0 flex items-center justify-center
            h-10 w-10 rounded-full
            bg-[var(--color-surface)] border border-[var(--color-border-subtle)]
            text-[var(--color-text-muted)]
            transition-all duration-150 ease-out
            ${tokens.arrowHover}
          `}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSelecting ? (
              <motion.span
                key="check"
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
                className={`flex items-center justify-center w-full h-full rounded-full text-white ${tokens.check}`}
              >
                <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="arrow"
                initial={false}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="flex items-center justify-center"
              >
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isSelecting && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden" aria-hidden>
          <div className={`h-full w-full origin-left animate-mode-select-pulse ${tokens.pulse}`} />
        </div>
      )}
    </motion.button>
  );
}

function StatPill({
  value,
  label,
  icon,
  accentClass,
  delay,
  reduceMotion,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  accentClass: string;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }
      }
      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/80 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${accentClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="font-display text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] leading-none">
          {value}
        </p>
        <p className="mt-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] truncate">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

interface StudentModeSelectionPageProps {
  /** Optional override for the logo mark SVG/PNG path. */
  logoSrc?: string;
}

export default function StudentModeSelectionPage({
  logoSrc = '/aira-mark.png',
}: StudentModeSelectionPageProps = {}) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const reduceAnimations = useSettingsStore(
    (s) => s.settings.accessibility.reduceAnimations
  );
  const reduceMotion = Boolean(prefersReducedMotion || reduceAnimations);

  const [selecting, setSelecting] = useState<ModeAccent | null>(null);

  const selectMode = useCallback(
    (mode: ModeAccent, path: string) => {
      if (selecting) return;
      setSelecting(mode);
      // Remembered so the next sign-in lands here directly instead of
      // asking for the same choice again.
      writeStudentHomeHint(path);
      const delay = reduceMotion ? 0 : 420;
      window.setTimeout(() => navigate(path), delay);
    },
    [navigate, reduceMotion, selecting]
  );

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <PageTransition>
      <div className="mode-selection min-h-screen flex flex-col relative overflow-hidden font-sans">
        {/* Soft brand aurora blobs */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-[8%] right-[-6%] h-[420px] w-[420px] sm:h-[500px] sm:w-[500px] rounded-full bg-[var(--color-brand)]/[0.08] dark:bg-[var(--color-brand)]/[0.1] blur-[100px] sm:blur-[120px] motion-safe:animate-aurora-drift" />
          <div className="absolute -bottom-[10%] -left-[8%] h-[360px] w-[360px] sm:h-[440px] sm:w-[440px] rounded-full bg-[var(--color-curriculum)]/[0.08] dark:bg-[var(--color-curriculum)]/[0.07] blur-[90px] sm:blur-[110px] motion-safe:animate-aurora-drift-alt" />
          <div className="absolute top-[32%] left-[22%] h-[300px] w-[300px] sm:h-[380px] sm:w-[380px] rounded-full bg-[var(--color-competitive)]/[0.07] dark:bg-[var(--color-competitive)]/[0.06] blur-[100px] sm:blur-[130px] motion-safe:animate-aurora-drift" />
        </div>

        <header className="relative z-50 sticky top-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 py-3 sm:py-3.5">
            <div className="flex items-center gap-5 lg:gap-8 min-w-0">
              <Link
                to={studentRoutes.dashboard}
                className="group rounded-lg p-1 -ml-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] transition-opacity duration-150 hover:opacity-[0.85]"
                aria-label="Aɪra — go to dashboard"
              >
                <AiraLogo markSrc={logoSrc} height={40} />
              </Link>

              {/* Segmented control */}
              <div
                className="hidden md:inline-flex items-center rounded-full border border-[var(--color-border-subtle)] bg-black/[0.03] dark:bg-white/[0.05] p-1"
                role="tablist"
                aria-label="Primary navigation"
              >
                <Link
                  to={studentRoutes.dashboard}
                  role="tab"
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-[var(--color-text-muted)] transition-all duration-150 ease-out hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
                >
                  Dashboard
                </Link>
                <span
                  role="tab"
                  aria-selected="true"
                  aria-current="page"
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] shadow-sm ring-1 ring-[var(--color-brand)]/20"
                >
                  Select Domain
                </span>
              </div>
            </div>

            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-transparent px-3.5 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] hover:bg-[var(--color-surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
            >
              <Zap className="h-3.5 w-3.5 text-[var(--color-brand)]" aria-hidden />
              Explore Guides
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 w-full">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-16 px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
            <section className="md:col-span-5 lg:col-span-5 flex flex-col justify-center text-center md:text-left">
              <motion.div
                {...fadeUp(0)}
                className="inline-flex self-center md:self-start items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-surface-elevated))] px-3.5 py-1.5 mb-6 sm:mb-7"
              >
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand)] opacity-50 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Interactive Selection
                </span>
              </motion.div>

              <h1 className="font-display font-extrabold tracking-[-0.03em] text-[var(--color-text-primary)] leading-[0.9] mb-5 sm:mb-6">
                <motion.span
                  className="block text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-[5.5rem]"
                  {...fadeUp(0.08)}
                >
                  Design Your
                </motion.span>
                <motion.span
                  className="block text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-[5.5rem] text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand)] via-[#6366F1] to-[#8B5CF6] dark:from-[#60A5FA] dark:via-[#818CF8] dark:to-[#A78BFA] animate-gradient-shimmer bg-[length:200%_auto]"
                  {...fadeUp(0.14)}
                >
                  Path.
                </motion.span>
              </h1>

              <motion.p
                className="text-base sm:text-lg leading-relaxed text-[var(--color-text-muted)] max-w-md mx-auto md:mx-0 mb-8 sm:mb-10"
                {...fadeUp(0.22)}
              >
                Choose how you learn — board mastery or national entrance prep — on one focused platform.
              </motion.p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
                <StatPill
                  value="24/7"
                  label="AI Mentorship"
                  icon={<Sparkles className="h-4 w-4 fill-[var(--color-brand)] text-[var(--color-brand)]" aria-hidden />}
                  accentClass="bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)]"
                  delay={0.38}
                  reduceMotion={reduceMotion}
                />
                <StatPill
                  value="98%"
                  label="Success Index"
                  icon={<Star className="h-4 w-4 fill-[var(--color-curriculum)] text-[var(--color-curriculum)]" aria-hidden />}
                  accentClass="bg-[color-mix(in_srgb,var(--color-curriculum)_12%,transparent)]"
                  delay={0.46}
                  reduceMotion={reduceMotion}
                />
              </div>
            </section>

            <section
              className="md:col-span-7 lg:col-span-7 flex flex-col justify-center"
              aria-labelledby="available-routes-heading"
            >
              <div className="w-full max-w-[560px] md:max-w-[85%] md:ml-auto">
                <motion.div className="flex items-center gap-4 mb-4 sm:mb-5" {...fadeUp(0.18)}>
                  <h2
                    id="available-routes-heading"
                    className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] whitespace-nowrap"
                  >
                    <span className="h-1 w-1 rounded-full bg-[var(--color-brand)]" aria-hidden />
                    Available Routes
                  </h2>
                  <div className="h-px flex-1 bg-[var(--color-border-subtle)]" aria-hidden />
                </motion.div>

                <div className="flex flex-col gap-3 sm:gap-3.5">
                  <ModeCard
                    title="Curriculum Mode"
                    icon={<BookOpen className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} aria-hidden />}
                    accent="curriculum"
                    badge="Most Popular"
                    onSelect={() => selectMode('curriculum', studentRoutes.curriculum)}
                    isSelecting={selecting === 'curriculum'}
                    delay={0.26}
                    reduceMotion={reduceMotion}
                  />
                  <ModeCard
                    title="Competitive Mode"
                    icon={<Award className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} aria-hidden />}
                    accent="competitive"
                    badge="New Cohort"
                    onSelect={() => selectMode('competitive', studentRoutes.competitive)}
                    isSelecting={selecting === 'competitive'}
                    delay={0.34}
                    reduceMotion={reduceMotion}
                  />
                </div>

                <motion.p
                  className="mt-4 text-left text-sm text-[var(--color-text-muted)]"
                  {...fadeUp(0.42)}
                >
                  Switch anytime · 3 min setup
                </motion.p>
              </div>
            </section>
          </div>
        </main>

        <footer className="relative z-50 mt-auto border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-8 lg:px-12 py-8 sm:py-10 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-center md:items-start gap-2">
              <AiraLogo markSrc={logoSrc} height={32} />
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Premium Learning Ecosystem
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Footer">
              {(
                [
                  { label: 'Curriculum', to: studentRoutes.curriculum, external: false },
                  { label: 'Competitive', to: studentRoutes.competitive, external: false },
                  { label: 'Privacy', to: `${import.meta.env.VITE_LANDING_ORIGIN || ''}/privacy`, external: true },
                  { label: 'Terms', to: `${import.meta.env.VITE_LANDING_ORIGIN || ''}/terms`, external: true },
                  { label: 'Support', to: `${import.meta.env.VITE_LANDING_ORIGIN || ''}/about`, external: true },
                ] as const
              ).map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.to}
                    className="group relative text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-150 group-hover:w-full" aria-hidden />
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="group relative text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-150 group-hover:w-full" aria-hidden />
                  </Link>
                ),
              )}
            </nav>

            <p className="text-center md:text-right text-xs font-medium text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Aɪra. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
