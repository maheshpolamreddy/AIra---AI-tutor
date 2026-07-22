import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans flex flex-col">
      <header className="px-6 sm:px-10 py-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-10 py-12 sm:py-16">
        <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-black prose-headings:tracking-tight">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 not-prose">
            {title}
          </h1>
          {children}
        </article>
      </main>

      <Footer />
    </div>
  );
}
