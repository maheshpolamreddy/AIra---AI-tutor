import LegalPageLayout from '../../components/landing/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <section className="space-y-6 text-slate-700 dark:text-slate-300">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2><p className="leading-relaxed">By accessing or using Aɪra, you agree to be bound by these Terms of Service.</p></div>
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Use of the Service</h2><p className="leading-relaxed">Aɪra provides AI-powered educational content. You agree to use the Service only for lawful educational purposes.</p></div>
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Contact</h2><p className="leading-relaxed">Questions? Contact <a href="mailto:legal@aira.app" className="text-indigo-600 hover:underline">legal@aira.app</a>.</p></div>
      </section>
    </LegalPageLayout>
  );
}
