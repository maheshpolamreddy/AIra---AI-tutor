import LegalPageLayout from '../../components/landing/LegalPageLayout';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function BlogPage() {
  return (
    <LegalPageLayout title="Blog">
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 not-prose">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6"><Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /></div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Coming Soon</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-8">We&apos;re preparing articles on learning science, exam strategies, and product updates.</p>
        <Link to="/" className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors">Back to home</Link>
      </div>
    </LegalPageLayout>
  );
}
