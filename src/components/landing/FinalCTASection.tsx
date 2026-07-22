import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TRUST_ITEMS = ['No credit card required', '14 days free access', 'Cancel anytime'];

export default function FinalCTASection() {
  return (
    <section className="relative py-20 sm:py-28 px-6 sm:px-10">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 sm:px-16 py-14 sm:py-20 text-center shadow-2xl shadow-indigo-900/30">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-4">Start learning smarter today</h2>
            <p className="text-indigo-200/90 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">Join thousands of students and educators using Aɪra for curriculum mastery and competitive exam prep.</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-900 font-black text-sm sm:text-base hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20">
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {TRUST_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-indigo-100/90">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
