import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '../stores/userStore';
import {
    BookOpen, Brain, User, LogOut,
    Play, Clock, Sparkles, GraduationCap,
    TrendingUp, Zap, Target, ChevronRight, RefreshCw,
    Search, Star, Home
} from 'lucide-react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import PageTransition from '../components/common/PageTransition';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { toast } from '../stores/toastStore';
import { getRoutesForRole, studentRoutes } from '../utils/routes';
import ExamAnalyticsCard from '../components/dashboard/ExamAnalyticsCard';
import { AɪraMascot, AchievementStar } from '../components/dashboard/DashboardVisuals';
import { schoolGrades } from '../data/schoolCurriculum';
import { useTeachingStore } from '../stores/teachingStore';
const CATEGORIES = ['For You', 'Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology'];

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout, role } = useAuthStore(useShallow(state => ({ user: state.user, logout: state.logout, role: state.role })));
    const routes = getRoutesForRole(role);
    const { profile } = useUserStore(useShallow(state => ({ profile: state.profile })));
    const { metrics } = useAnalyticsStore(useShallow(state => ({ metrics: state.metrics })));
    const { currentSession } = useTeachingStore(useShallow(state => ({ currentSession: state.currentSession })));
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('For You');

    // Aggregate all school topics
    const allSchoolTopics = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topics: any[] = [];
        schoolGrades.forEach(g => {
            g.subjects.forEach(s => {
                s.chapters.forEach(c => {
                    c.topics.forEach(t => {
                        topics.push({
                            ...t,
                            category: 'School',
                            spec: s.name,
                            categoryId: s.id,
                            icon: s.icon,
                            grade: g.name,
                            isNew: Math.random() > 0.9
                        });
                    });
                });
            });
        });
        return topics;
    }, []);

    const filteredTopics = useMemo(() => {
        let base = [];

        if (activeCategory === 'For You') {
            // For you: Mix of subjects based on engagement or just general high-impact ones
            base = allSchoolTopics.filter(t =>
                t.categoryId === 'mathematics' ||
                t.categoryId === 'science' ||
                t.categoryId === 'physics'
            ).slice(0, 12);
        } else {
            base = allSchoolTopics.filter(t =>
                t.spec === activeCategory || t.category === activeCategory
            );
        }

        if (searchQuery) {
            return base.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return base.slice(0, 12);
    }, [activeCategory, searchQuery, allSchoolTopics]);

    const handleLogout = () => {
        logout();
        toast.success('Security protocol active. Logged out.');
        navigate('/login');
    };

    const handleSwitchRole = () => {
        toast.info('Switching mission profile...');
        // Must clear the session first — navigating to /login while still
        // authenticated leaves a stale session and bounces back via redirects.
        logout();
        navigate('/login');
    };

    const handleStartTopic = (topicId: string) => {
        const learnPath = 'learn' in routes ? (routes as typeof studentRoutes).learn(topicId) : studentRoutes.learn(topicId);
        navigate(learnPath);
    };

    return (
        <div className="min-h-screen min-h-[100dvh] relative overflow-hidden transition-colors duration-500">
            {/* Ultra-Vibrant Mesh Gradient System */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Base Layer */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-700" />

                {/* High-Vibrancy Mesh Blobs - Enhanced Palette */}
                <div className="absolute inset-0 opacity-[0.45] dark:opacity-[0.3] transition-opacity duration-700">
                    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(99,102,241,0.6)_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[10%] right-[-15%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(244,63,94,0.5)_0%,transparent_70%)]" />
                    <div className="absolute bottom-[-15%] left-[5%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(6,182,212,0.4)_0%,transparent_70%)]" />
                    <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(139,92,246,0.5)_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '12s' }} />
                    <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)]" />
                </div>

                {/* Floating Animated Decorations (Stars/Dots/Symbols) */}
                <motion.div
                    className="absolute top-[15%] left-[15%] w-10 h-10 text-yellow-400/40 hw-accelerate"
                    animate={{ rotate: 360, scale: [1, 1.2, 1], y: [0, -30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Sparkles className="w-full h-full drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </motion.div>

                <motion.div
                    className="absolute bottom-[25%] right-[15%] w-14 h-14 text-indigo-400/30 hw-accelerate"
                    animate={{ rotate: -360, scale: [1, 1.3, 1], x: [0, 40, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Brain className="w-full h-full drop-shadow-[0_0_15px_rgba(129,140,248,0.4)]" />
                </motion.div>

                <motion.div
                    className="absolute top-[40%] right-[10%] w-12 h-12 text-purple-400/20 hw-accelerate"
                    animate={{ y: [0, 100, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                >
                    <GraduationCap className="w-full h-full" />
                </motion.div>

                <motion.div
                    className="absolute bottom-[40%] left-[8%] w-10 h-10 text-pink-400/20 hw-accelerate"
                    animate={{ x: [0, 50, 0], rotate: [0, 45, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                >
                    <BookOpen className="w-full h-full" />
                </motion.div>

                {/* Noise/Grain Texture */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '128px 128px'
                    }}
                />
            </div>

            <div className="relative z-10 w-full h-screen scroll-optimized custom-scrollbar flex flex-col">
                {/* Header - Fixed & High Stacking */}
                <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-sm sticky top-0 z-[100] safe-top w-full">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
                        <Link
                            to={'learn' in routes ? (routes as typeof studentRoutes).learn(currentSession?.topicId || 'math-6-1-knowing-numbers') : routes.dashboard}
                            className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-95 z-20"
                            aria-label="Dashboard"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all">
                                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">Aɪra</span>
                        </Link>

                        <nav className="flex items-center gap-1 sm:gap-2 z-20">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 180 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={handleSwitchRole}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative group"
                                aria-label="Switch Role"
                            >
                                <RefreshCw className="w-5 h-5 pointer-events-none" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Switch Profile</span>
                            </motion.button>



                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={() => navigate(routes.profile)}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative group"
                                aria-label="Profile"
                            >
                                <User className="w-5 h-5 pointer-events-none" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Account</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, x: 2 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={handleLogout}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative group"
                                aria-label="Logout"
                            >
                                <LogOut className="w-5 h-5 pointer-events-none" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Logout</span>
                            </motion.button>
                        </nav>
                    </div>
                </header>

                <main className="flex-1 w-full overflow-x-hidden relative" id="main-content" tabIndex={-1}>
                    <PageTransition className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                        {/* Breadcrumbs - Responsive */}
                        <Breadcrumbs role={role} homePath={routes.dashboard} items={[{ label: 'Dashboard' }]} className="mb-3 sm:mb-4" />

                        <motion.div
                            className="mb-10 relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex flex-col lg:flex-row items-center gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-8 sm:p-12 border border-white/30 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
                                {/* Decorative Blobs */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />

                                {/* Mascot Section */}
                                <motion.div
                                    className="shrink-0 relative group"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    {/* Responsive Mascot Container */}
                                    <div className="w-[120px] sm:w-[180px]">
                                        <AɪraMascot size="100%" />
                                    </div>
                                    <motion.div
                                        className="absolute -top-4 -right-2 sm:-right-4"
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                    >
                                        <AchievementStar size={48} className="hidden sm:block" />
                                        <AchievementStar size={36} className="block sm:hidden" />
                                    </motion.div>
                                </motion.div>

                                <div className="flex-1 text-center lg:text-left min-w-0">
                                    <motion.h1
                                        className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 tracking-tight leading-[1.1] break-words"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        Welcome back, <br className="hidden sm:block" />
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                                            Aɪra dashboard! 👋
                                        </span>
                                    </motion.h1>
                                    <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-slate-400 font-medium max-w-xl mx-auto lg:mx-0 break-words">
                                        {profile?.profession?.name && profile?.subProfession ? (
                                            <>Your mission continues in <span className="text-indigo-600 dark:text-indigo-400 font-black">{profile.profession.name}</span>. Ready for new challenges?</>
                                        ) : (
                                            'Mission Control is ready! What amazing things will you learn today?'
                                        )}
                                    </p>

                                    <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap justify-center lg:justify-start gap-4 sm:gap-6">
                                        <div className="flex flex-col items-center lg:items-start p-3 rounded-2xl bg-white/30 dark:bg-slate-800/20 lg:bg-transparent">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.totalHours}h</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Flight Time</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden lg:block self-center"></div>
                                        <div className="flex flex-col items-center lg:items-start p-3 rounded-2xl bg-white/30 dark:bg-slate-800/20 lg:bg-transparent">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.averageQuizScore}%</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Accuracy</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden lg:block self-center"></div>
                                        <div className="flex flex-col items-center lg:items-start p-3 rounded-2xl bg-white/30 dark:bg-slate-800/20 lg:bg-transparent col-span-2 md:col-span-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-bounce" />
                                                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.streakDays}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Day Streak</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Exam Analytics */}
                        <div className="mb-8">
                            <ExamAnalyticsCard />
                        </div>

                        {/* Enhanced Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Learning Journey Chart (SVG) */}
                            <motion.div
                                className="lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl border border-white/30 dark:border-slate-800/50 relative overflow-hidden group"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {/* Inner Glow & Grid */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
                                    style={{ backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                                            Learning Journey
                                        </h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Mission Progress</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">+24% GROWTH</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-48 sm:h-56 w-full relative group perspective-1000">
                                    <svg viewBox="0 0 700 180" preserveAspectRatio="xMidYMid meet" className="w-full h-full drop-shadow-2xl overflow-visible">
                                        {/* Background Grid Lines */}
                                        {[0, 60, 120, 180].map((y, i) => (
                                            <motion.line
                                                key={i}
                                                x1="0" y1={y} x2="700" y2={y}
                                                stroke="currentColor"
                                                className="text-slate-200 dark:text-slate-800"
                                                strokeWidth="1"
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                            />
                                        ))}

                                        {/* Data Path with Shadow */}
                                        <motion.path
                                            d="M 20 160 Q 150 40 300 110 T 600 30 T 680 150"
                                            fill="none"
                                            stroke="url(#chartGradient)"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            filter="url(#glow)"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 2.5, ease: "easeOut" }}
                                        />

                                        {/* Liquid Area Fill */}
                                        <motion.path
                                            d="M 20 160 Q 150 40 300 110 T 600 30 T 680 150 V 180 H 20 Z"
                                            fill="url(#areaLiquidGradient)"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.5, duration: 1.5 }}
                                        />

                                        {/* Pulse Points */}
                                        {[20, 150, 300, 450, 600, 680].map((x, i) => {
                                            const y = i === 0 ? 160 : i === 1 ? 40 : i === 2 ? 110 : i === 3 ? 70 : i === 4 ? 30 : 150;
                                            return (
                                                <g key={i}>
                                                    <motion.circle
                                                        cx={x} cy={y} r="8"
                                                        className="fill-indigo-500/20"
                                                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                                    />
                                                    <motion.circle
                                                        cx={x} cy={y} r="4"
                                                        className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
                                                        strokeWidth="2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 2 + i * 0.1 }}
                                                        whileHover={{ scale: 1.5 }}
                                                    />
                                                </g>
                                            );
                                        })}

                                        <defs>
                                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#4f46e5" />
                                                <stop offset="50%" stopColor="#9333ea" />
                                                <stop offset="100%" stopColor="#db2777" />
                                            </linearGradient>
                                            <linearGradient id="areaLiquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                            </linearGradient>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="4" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                    </svg>

                                    {/* Hover Stats Card */}
                                    <div className="absolute top-0 right-0 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Rating</p>
                                                <p className="text-lg font-black text-slate-800 dark:text-white">94.2 <span className="text-[10px] text-emerald-500">+2.1</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Strength & Weakness Cards */}
                            <div className="flex flex-col gap-4">
                                <motion.div
                                    className="flex-1 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                                        <Zap className="w-24 h-24" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-white/20 rounded-xl">
                                                <Zap className="w-5 h-5 text-yellow-300" />
                                            </div>
                                            <span className="font-black uppercase tracking-widest text-[10px]">Super Strength</span>
                                        </div>
                                        <h3 className="text-3xl font-black mb-1">Visual Analysis</h3>
                                        <p className="text-indigo-100 text-sm font-medium">Exceeding 92% of peers!</p>
                                        <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden border border-white/10">
                                            <motion.div
                                                className="bg-gradient-to-r from-yellow-300 to-white w-[92%] h-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: "92%" }}
                                                transition={{ duration: 2, delay: 1 }}
                                            ></motion.div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/30 dark:border-slate-800/50 shadow-2xl group transition-all"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                                        <div className="p-2 bg-pink-500/10 rounded-xl">
                                            <Target className="w-5 h-5 text-pink-500" />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Target Focus</span>
                                    </div>
                                    <h3 className="text-2xl font-black mb-1 dark:text-white">Pharmacology</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Next Mission: 15-min deep dive</p>
                                    <motion.button
                                        className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        Launch Analysis <ChevronRight className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Topic Discovery Section */}
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-purple-500" />
                                        Topic Discovery
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Explore Missions for your journey</p>
                                </div>

                                {/* Custom Glassmorphic Search */}
                                <div className="relative w-full md:w-80 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search topics..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-slate-800/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-400 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Category Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border ${activeCategory === cat
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                                            : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {filteredTopics.map((topic, index) => (
                                        <motion.div
                                            key={topic.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            transition={{ delay: index * 0.01 }}
                                            className="relative overflow-hidden group cursor-pointer p-6 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/30 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all"
                                            onClick={() => handleStartTopic(topic.id)}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                        >
                                            {/* Top Indicators */}
                                            <div className="absolute top-4 right-6 flex items-center gap-2">
                                                {topic.isNew && (
                                                    <motion.div
                                                        className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white rounded-full uppercase"
                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    >
                                                        NEW
                                                    </motion.div>
                                                )}
                                                <Star className="w-4 h-4 text-slate-300 group-hover:text-yellow-400 transition-colors" />
                                            </div>

                                            <div className="flex flex-col h-full space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Brain className="w-6 h-6 text-purple-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-black text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight truncate">
                                                            {topic.name}
                                                        </h3>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{topic.spec || topic.category}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                            <Clock className="w-3 h-3" />
                                                            {topic.duration || '30 MIN'}
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${topic.difficulty === 'beginner' ? 'bg-green-100 text-green-600 dark:bg-green-500/20' :
                                                            topic.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20' :
                                                                'bg-rose-100 text-rose-600 dark:bg-rose-500/20'
                                                            }`}>
                                                            {topic.difficulty || 'Beginner'}
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors"
                                                        whileHover={{ rotate: 90 }}
                                                    >
                                                        <Play className="w-3 h-3 ml-0.5" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Mission Control Quick Access */}
                        <motion.div
                            className="mt-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-indigo-500" />
                                        Mission Control Quick Access
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapid Command Interface</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Mode Selection */}
                                {'modeSelection' in routes && (
                                    <motion.button
                                        onClick={() => navigate((routes as { modeSelection: string }).modeSelection)}
                                        className="relative overflow-hidden group p-6 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/30 dark:border-slate-800/50 shadow-xl text-left"
                                        whileHover={{ y: -5, scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <span className="font-black text-sm text-slate-800 dark:text-white">Learning Mode</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Switch between Curriculum and Competitive prep.</p>
                                        <div className="flex items-center text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                            Configure Mission <ChevronRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </motion.button>
                                )}

                                {/* School Curriculum */}
                                {'curriculum' in routes && (
                                    <motion.button
                                        onClick={() => navigate((routes as { curriculum: string }).curriculum)}
                                        className="relative overflow-hidden group p-6 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/30 dark:border-slate-800/50 shadow-xl text-left"
                                        whileHover={{ y: -5, scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <GraduationCap className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <span className="font-black text-sm text-slate-800 dark:text-white">Study Vault</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Browse classes 6-12 with subject analysis.</p>
                                        <div className="flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                            Access Data <ChevronRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </motion.button>
                                )}



                                {/* Profile */}
                                <motion.button
                                    onClick={() => navigate(routes.profile)}
                                    className="relative overflow-hidden group p-6 rounded-[2.5rem] bg-indigo-600 shadow-xl shadow-indigo-500/30 text-left"
                                    whileHover={{ y: -5, scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-sm text-white">Identity</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                                            {(user?.displayName || user?.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-white truncate">{user?.displayName || user?.name}</p>
                                            <p className="text-[8px] font-medium text-indigo-100 opacity-70 uppercase truncate">{profile?.profession?.name || 'Explorer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-[10px] font-black text-white/80 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        View Identity <ChevronRight className="w-3 h-3 ml-1" />
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    </PageTransition >
                </main >
            </div >
        </div >
    );
}
