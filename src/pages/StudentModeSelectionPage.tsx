
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, ArrowRight, Layout, Award, Zap, Target, Star } from 'lucide-react';
import { studentRoutes } from '../utils/routes';
import PageTransition from '../components/common/PageTransition';

interface ModeTileProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  onClick: () => void;
  delay?: number;
}

function ModeTile({ title, subtitle, icon, color, gradient, onClick, delay = 0 }: ModeTileProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative group w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-7 lg:px-10 flex items-center justify-between shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-500 overflow-hidden"
    >
      {/* 🚀 STYLISH DUAL-BORDER & TINT */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
      <div className={`absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 ${gradient}`} />
      
      {/* ✨ SPARKLES */}
      <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full blur-[0.5px]"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-6 sm:gap-10 relative z-10 w-full min-w-0">
        {/* 🧊 3D ICON CONTAINER */}
        <div className="relative perspective-800">
          <motion.div 
            className={`relative w-14 h-14 sm:w-18 sm:h-18 flex-shrink-0 rounded-2xl ${gradient} flex items-center justify-center text-white shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] shadow-indigo-500/20 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] transition-all duration-500`}
            style={{ transformStyle: 'preserve-3d' }}
            whileHover={{ 
              rotateY: 15, 
              rotateX: -10,
              translateZ: 20
            }}
          >
            {/* 3D Depth Layers */}
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-[2px] -translate-z-4" />
            <div className="relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] scale-90 sm:scale-100 transform translate-z-10 text-white">
              {icon}
            </div>
          </motion.div>
        </div>
        
        <div className="text-left flex-1 min-w-0">
          <h3 className={`text-xl sm:text-2xl font-black ${color} dark:text-white transition-colors tracking-tighter leading-none mb-1 sm:mb-2 truncate`}>{title}</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold opacity-60 uppercase tracking-[0.2em] truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 ml-4">
        {/* 🏹 SMALLER REFINED ARROW */}
        <div className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-indigo-600 group-hover:scale-95 group-hover:rotate-12 transition-all duration-300 shadow-sm`}>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  );
}

export default function StudentModeSelectionPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans flex flex-col relative overflow-hidden">
        
        {/* ✨ VIBRANT ANIMATED MESH BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Floating Blobs with Smooth Animations */}
          <motion.div 
            className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/10 blur-[100px] sm:blur-[140px]"
            animate={{ 
              x: [0, 40, 0],
              y: [0, -20, 0],
              scale: [1, 1.05, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/40 dark:bg-emerald-900/10 blur-[90px] sm:blur-[130px]"
            animate={{ 
              x: [0, -30, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-orange-200/30 dark:bg-orange-900/10 blur-[110px] sm:blur-[150px]"
            animate={{ 
              x: [0, 20, 0],
              y: [0, 40, 0],
              scale: [1, 0.95, 1] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#4F46E5_1px,transparent_1px)] [background-size:30px_30px] sm:[background-size:40px_40px]" />
        </div>

        {/* REFINED HEADER */}
        <header className="relative z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 py-4 sm:py-6 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-6 sm:gap-12">
            <button onClick={() => navigate(studentRoutes.dashboard)} className="flex items-center gap-3 sm:gap-4 group">
              <motion.div 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                whileHover={{ rotate: 12 }}
              >
                <Sparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </motion.div>
              <span className="font-black text-2xl sm:text-3xl tracking-tighter text-slate-900 dark:text-white">Aɪra</span>
            </button>
            <nav className="hidden lg:flex items-center gap-1">
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
              <div className="px-5 py-2.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
                <Layout size={16} className="text-indigo-500/50" />
                Select Domain
              </div>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-2 group cursor-pointer px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                <Zap size={15} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">EXPLORE GUIDES</span>
             </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-6 sm:px-10 py-8 sm:py-12 gap-10 md:gap-16 lg:gap-24 relative z-10 overflow-y-auto sm:overflow-visible">
          
          {/* Left Hero Side */}
          <div className="w-full md:w-[45%] flex flex-col justify-center text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 border border-indigo-100 dark:border-indigo-800"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-500 animate-[pulse_1.5s_infinite]" />
                Interactive Selection
              </motion.div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.95] sm:leading-[0.9] mb-6 sm:mb-10">
                Design Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400">Path.</span>
              </h1>
              
              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-8 sm:mb-12 max-w-md mx-auto md:mx-0 opacity-80">
                A high-performance educational platform built to transform how you learn, compete, and succeed.
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-sm mx-auto md:mx-0">
                <div className="flex flex-col gap-1 group">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-indigo-600 transition-colors">12K+</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Target size={14} className="text-indigo-500" />
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Learners</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 group">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-emerald-500 transition-colors">98%</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Star size={14} className="text-emerald-500" />
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Success Index</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Mode Side */}
          <div className="w-full md:w-[55%] flex flex-col justify-center gap-6 sm:gap-8 pt-4 md:pt-0">
            <div className="flex items-center gap-4 sm:gap-6 mb-2">
               <h4 className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] sm:tracking-[0.3em] whitespace-nowrap">Available Routes</h4>
               <div className="h-[2px] w-full bg-indigo-100 dark:bg-slate-800 rounded-full" />
            </div>

            <div className="flex flex-col gap-4 sm:gap-5">
              <ModeTile
                title="Curriculum Mode"
                subtitle="ACADEMIC BOARD EXCELLENCE"
                icon={<BookOpen className="w-7 h-7 sm:w-9 sm:h-9" />}
                color="text-emerald-600"
                gradient="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500"
                onClick={() => navigate(studentRoutes.curriculum)}
                delay={0.1}
              />

              <ModeTile
                title="Competitive Mode"
                subtitle="NATIONAL ENTRANCE ARENA"
                icon={<Award className="w-7 h-7 sm:w-9 sm:h-9" />}
                color="text-orange-600"
                gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600"
                onClick={() => navigate(studentRoutes.competitive)}
                delay={0.2}
              />
            </div>

          </div>

        </div>

        {/* MODERN FOOTER */}
        <footer className="relative z-50 px-6 sm:px-10 py-6 sm:py-10 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl mt-auto">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
              <div className="flex flex-col items-center md:items-start gap-1 sm:gap-2">
                <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">Aɪra</span>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.25em]">Premium Learning Ecosystem</p>
              </div>
              
              <div className="h-[1px] w-12 bg-slate-200 dark:bg-slate-800 hidden md:block" />
              
              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
                 {['Curriculum', 'Competitive', 'Safety', 'Ethics', 'Support'].map(link => (
                   <button key={link} className="text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors">{link}</button>
                 ))}
              </div>
              
              <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-right">
                © 2024 AIra. All Rights Reserved.
              </div>
           </div>
        </footer>

      </div>
    </PageTransition>
  );
}

