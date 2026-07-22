import { Link } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import Footer from '../components/landing/Footer';

const PLANS = [
  { name: 'Free', price: '0', period: 'forever', description: 'Explore curriculum and competitive prep with core features.', features: ['Curriculum access (limited topics)', 'Competitive mock exams', 'AI chat & doubt resolution', 'Basic analytics'], cta: 'Get started', highlighted: false },
  { name: 'Pro', price: '499', period: 'per month', description: 'Full access for serious learners and exam prep.', features: ['Unlimited curriculum topics', 'Unlimited AI-generated mocks', 'Synced speech & visuals', 'Advanced analytics & badges', 'Priority support'], cta: 'Start free trial', highlighted: true },
  { name: 'School', price: 'Custom', period: 'contact us', description: 'For institutions — teachers, admins, and student cohorts.', features: ['Multi-role dashboards', 'Class & cohort management', 'Admin analytics', 'Custom onboarding', 'Dedicated support'], cta: 'Contact sales', highlighted: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans flex flex-col">
      <header className="px-6 sm:px-10 py-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to home</Link>
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">Sign In <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </header>
      <main className="flex-1 px-6 sm:px-10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Simple, transparent pricing</h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-lg">Start free. Upgrade when you need full access. Schools get custom plans.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl sm:rounded-3xl border p-8 flex flex-col ${plan.highlighted ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-200/40 dark:shadow-none ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/30 dark:shadow-none'}`}>
                {plan.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">Most popular</span>}
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{plan.name}</h2>
                <div className="mb-4">{plan.price === 'Custom' ? <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span> : <><span className="text-3xl font-black text-slate-900 dark:text-white">₹{plan.price}</span><span className="text-sm text-slate-500 ml-1">/{plan.period}</span></>}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />{f}</li>))}</ul>
                <Link to={plan.name === 'School' ? 'mailto:sales@aira.app' : '/login'} className={`block text-center py-3 rounded-xl font-bold transition-colors ${plan.highlighted ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
