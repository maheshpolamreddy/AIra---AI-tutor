import { useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';
import { studentRoutes } from '../utils/routes';
import PageTransition from '../components/common/PageTransition';
import CompetitiveDashboard from '../components/competitive/CompetitiveDashboard';

export default function StudentCompetitivePage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500 flex flex-col">
        {/* Ultra-Vibrant Mesh Gradient System */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Base Layer - Deeper tint to make white cards pop */}
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950 transition-colors duration-700" />

          {/* High-Vibrancy Mesh Blobs - Upgraded to richer jewel tones */}
          <div className="absolute inset-0 opacity-[0.55] dark:opacity-[0.4] transition-opacity duration-1000">
            {/* Top Left - Deep Violet/Indigo */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(79,70,229,0.7)_0%,transparent_70%)] mix-blend-multiply dark:mix-blend-screen" />

            {/* Top Right - Fuchsia/Pink */}
            <div className="absolute top-[-10%] right-[-15%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(217,70,239,0.6)_0%,transparent_70%)] mix-blend-multiply dark:mix-blend-screen" />

            {/* Center Left - Cyan/Teal */}
            <div className="absolute top-[30%] left-[-20%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(6,182,212,0.5)_0%,transparent_70%)] mix-blend-multiply dark:mix-blend-screen" />

            {/* Bottom Right - Rose/Orange */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(244,63,94,0.5)_0%,transparent_70%)] mix-blend-multiply dark:mix-blend-screen" />

            {/* Bottom Left - Rich Purple accent */}
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(147,51,234,0.5)_0%,transparent_70%)] mix-blend-multiply dark:mix-blend-screen" />
          </div>

          {/* High-Impact Animated Accents - Optimized with CSS rather than React JS thread loop */}
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-purple-400/30 rounded-full blur-[100px] animate-float hw-accelerate pointer-events-none" />

          {/* Noise/Grain Texture for Depth */}
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px'
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <header className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => navigate(studentRoutes.modeSelection)}
                className="group p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-black/5 dark:border-white/5 transition-all active:scale-95 flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold text-gray-600 dark:text-slate-300 hidden sm:inline">Back to Modes</span>
              </button>

              <div className="flex-1 flex justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 animate-gradient-x">
                  Aɪra
                </span>
              </div>
              
              <div className="w-[124px] hidden sm:block" /> {/* Balances flex space */}
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto overflow-hidden">
            <CompetitiveDashboard />
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
