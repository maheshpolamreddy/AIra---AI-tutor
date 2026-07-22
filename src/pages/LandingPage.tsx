import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, Award, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ProfessionalLearningSection from '../components/landing/ProfessionalLearningSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import Footer from '../components/landing/Footer';

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform"><Sparkles className="w-5 h-5" /></div>
        <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">Aɪra</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <Link to="/#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">Features</Link>
        <Link to="/#how-it-works" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">How It Works</Link>
        <Link to="/pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">Pricing</Link>
      </nav>
      <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-md shadow-indigo-200 dark:shadow-none">Sign In <ArrowRight className="w-4 h-4" /></Link>
    </header>
  );
}

const FEATURES = [
  { icon: BookOpen, title: 'Curriculum Mode', description: 'NCERT-aligned lessons with synced speech, diagrams, and AI doubt resolution for Classes 1–12.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Award, title: 'Competitive Mode', description: 'AI-generated mock papers for JEE, NEET, EAMCET, and more — fresh questions every attempt.', gradient: 'from-orange-500 to-amber-600' },
  { icon: GraduationCap, title: 'Multi-Role Platform', description: 'Dedicated dashboards for students, teachers, and administrators with analytics and controls.', gradient: 'from-indigo-500 to-violet-600' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans flex flex-col">
      <LandingNav />
      <section className="relative px-6 sm:px-10 pt-16 sm:pt-24 pb-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100 dark:border-indigo-800">AI-Powered Learning Platform</p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95] mb-6">Learn smarter with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500">Aɪra</span></h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">Interactive teaching, competitive exam prep, and professional courses — all in one intelligent platform built for schools and learners.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-colors shadow-xl shadow-indigo-200 dark:shadow-none">Get started free <ArrowRight className="w-5 h-5" /></Link>
              <Link to="/#how-it-works" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors">See how it works</Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section id="features" className="relative py-20 sm:py-28 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Everything you need to excel</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">From classroom curriculum to national entrance exams — one platform, personalized for every learner.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-md mb-6`}><Icon className="w-7 h-7" strokeWidth={1.75} /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <HowItWorksSection />
      <ProfessionalLearningSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
