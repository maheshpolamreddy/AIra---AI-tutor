import { Link } from 'react-router-dom';

const productLinks = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'How It Works', to: '/#how-it-works' },
];

const companyLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Careers', to: '/careers' },
];

const legalLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Cookies', to: '/cookies' },
];

export default function Footer() {
  return (
    <footer className="relative z-50 px-6 sm:px-10 py-10 sm:py-14 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="flex flex-col gap-3">
            <Link to="/" className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white w-fit">
              Aɪra
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Premium AI-powered learning for schools, competitive exams, and professional growth.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-400">&copy; {new Date().getFullYear()} AIra. All rights reserved.</p>
          <p className="text-xs text-slate-400">Built for learners, educators, and institutions.</p>
        </div>
      </div>
    </footer>
  );
}
