import LegalPageLayout from '../../components/landing/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <section className="space-y-6 text-slate-700 dark:text-slate-300">
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Information We Collect</h2><p className="leading-relaxed">We collect account information, usage data, and optional analytics if enabled in Settings.</p></div>
        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Your Rights</h2><p className="leading-relaxed">Contact <a href="mailto:privacy@aira.app" className="text-indigo-600 hover:underline">privacy@aira.app</a> to request access, correction, or deletion of your data.</p></div>
      </section>
    </LegalPageLayout>
  );
}
