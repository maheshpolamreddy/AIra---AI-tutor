import LegalPageLayout from '../../components/landing/LegalPageLayout';
import { Mail } from 'lucide-react';

export default function CareersPage() {
  return (
    <LegalPageLayout title="Careers">
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 not-prose">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-6"><Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /></div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">We&apos;re Growing</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-8">Send your resume to <a href="mailto:careers@aira.app" className="text-indigo-600 font-semibold hover:underline">careers@aira.app</a>.</p>
      </div>
    </LegalPageLayout>
  );
}
