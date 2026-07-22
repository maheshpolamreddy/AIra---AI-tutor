import LegalPageLayout from '../../components/landing/LegalPageLayout';

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <section className="space-y-6 text-slate-700 dark:text-slate-300">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Cookies We Use</h2><p className="leading-relaxed">Essential cookies for auth and sessions; preference cookies for theme and settings; optional analytics if enabled.</p></div>
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Contact</h2><p className="leading-relaxed">Questions? Email <a href="mailto:privacy@aira.app" className="text-indigo-600 hover:underline">privacy@aira.app</a>.</p></div>
      </section>
    </LegalPageLayout>
  );
}
