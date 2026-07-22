import { type LucideIcon, UserPlus, Sparkles, BookOpen, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  step: number;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  accentClass: string;
  badgeClass: string;
  borderClass: string;
}

const STEPS: Step[] = [
  { step: 1, title: 'Sign Up', description: 'Create your account in minutes — student, teacher, or admin.', detail: 'Choose your role and get instant access to curriculum or competitive prep.', icon: UserPlus, accentClass: 'from-indigo-400/20 to-indigo-500/10', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', borderClass: 'from-indigo-300/60 to-indigo-400/30' },
  { step: 2, title: 'Personalize', description: 'Set your grade, board, goals, and learning preferences.', detail: 'Aɪra adapts explanations, pace, and visuals to how you learn best.', icon: Sparkles, accentClass: 'from-indigo-500/25 to-indigo-600/10', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', borderClass: 'from-indigo-400/70 to-indigo-500/40' },
  { step: 3, title: 'Learn & Practice', description: 'Interactive lessons, synced visuals, quizzes, and doubt resolution.', detail: 'Speech and diagrams stay in sync while you study any topic or exam syllabus.', icon: BookOpen, accentClass: 'from-indigo-600/25 to-indigo-700/10', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', borderClass: 'from-indigo-500/80 to-indigo-600/50' },
  { step: 4, title: 'Succeed', description: 'Track progress, earn badges, and ace your exams with confidence.', detail: 'Analytics, streaks, and competitive mocks keep you exam-ready.', icon: Trophy, accentClass: 'from-indigo-600/30 to-indigo-700/15', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', borderClass: 'from-indigo-600 to-indigo-700' },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: index * 0.1 }} className="relative flex flex-col">
      <div className="hidden lg:flex absolute -top-8 left-1/2 -translate-x-1/2 z-20 items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
        <ChevronRight className="w-4 h-4" />
      </div>
      <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${step.borderClass}`} />
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accentClass} border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shadow-sm`}>
              <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${step.badgeClass}`}>Step {step.step}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{step.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 leading-relaxed">{step.detail}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 px-6 sm:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] mb-4">Your learning journey</p>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">How Aɪra Works</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Four connected steps from sign-up to success — not four unrelated tips.</p>
        </div>
        <div className="relative hidden lg:block mb-8">
          <div className="absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-600 rounded-full" />
        </div>
        <div className="relative lg:grid lg:grid-cols-4 lg:gap-6 flex flex-col gap-12 lg:gap-6">
          <div className="lg:hidden absolute left-7 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-400 to-indigo-600 rounded-full" />
          {STEPS.map((step, index) => (
            <div key={step.step} className="relative lg:pt-8">
              <div className="lg:hidden absolute left-5 top-10 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-950 z-10" />
              <div className="lg:pl-0 pl-10"><StepCard step={step} index={index} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
