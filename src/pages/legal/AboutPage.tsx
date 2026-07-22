import LegalPageLayout from '../../components/landing/LegalPageLayout';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <LegalPageLayout title="About Aɪra">
      <section className="space-y-6 text-slate-700 dark:text-slate-300">
        <p className="text-lg leading-relaxed">Aɪra is an AI-powered learning platform built to transform how students learn, teachers teach, and schools manage education.</p>
        <p className="leading-relaxed"><Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in or create an account</Link> to get started.</p>
      </section>
    </LegalPageLayout>
  );
}
