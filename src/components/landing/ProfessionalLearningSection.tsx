import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Scale, Code2, Briefcase, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import WaitlistModal from './WaitlistModal';

const PROFESSIONAL_COURSES: { id: string; name: string; description: string; icon: LucideIcon; gradient: string }[] = [
  { id: 'medicine', name: 'Medicine & Healthcare', description: 'Clinical sciences, anatomy, and board prep for medical students.', icon: Stethoscope, gradient: 'from-cyan-500 to-teal-600' },
  { id: 'law', name: 'Law & Legal Studies', description: 'Case analysis, statutes, and exam preparation for aspiring lawyers.', icon: Scale, gradient: 'from-violet-500 to-purple-600' },
  { id: 'engineering', name: 'Engineering & Tech', description: 'Core engineering concepts, GATE prep, and applied problem-solving.', icon: Code2, gradient: 'from-blue-500 to-indigo-600' },
  { id: 'business', name: 'Business & Management', description: 'MBA foundations, finance, and leadership skills for professionals.', icon: Briefcase, gradient: 'from-amber-500 to-orange-600' },
];

export default function ProfessionalLearningSection() {
  const [waitlistCourse, setWaitlistCourse] = useState<string | null>(null);
  return (
    <>
      <section id="professional" className="relative py-20 sm:py-28 px-6 sm:px-10 bg-slate-50/80 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] mb-4">Coming soon</p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Professional Learning</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base sm:text-lg">Specialized AI tutoring for career-focused disciplines — join the waitlist to get early access.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROFESSIONAL_COURSES.map((course, index) => {
              const Icon = course.icon;
              return (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }} className="group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col">
                  <div className={`h-1 w-full bg-gradient-to-r ${course.gradient}`} />
                  <div className="p-6 flex flex-col flex-1 gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.gradient} flex items-center justify-center text-white shadow-md`}><Icon className="w-6 h-6" strokeWidth={1.75} /></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">{course.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{course.description}</p>
                    </div>
                    <button type="button" onClick={() => setWaitlistCourse(course.name)} className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors">
                      <Bell className="w-4 h-4" /> Notify Me
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <WaitlistModal courseName={waitlistCourse ?? ''} isOpen={waitlistCourse !== null} onClose={() => setWaitlistCourse(null)} />
    </>
  );
}
