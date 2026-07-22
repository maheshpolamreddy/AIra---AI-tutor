
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getRoutesForRole } from '../utils/routes';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
import {
    ArrowLeft, Mail, MapPin, Calendar, Award, Target,
    Clock, Flame, BookOpen, Star, Edit2, TrendingUp, Settings,
    Users, Book, Activity, Shield, AlertCircle, FileText
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

export default function ProfilePage({ onClose }: { onClose?: () => void }) {
    const { user, role } = useAuthStore();
    const routes = getRoutesForRole(role);
    const { profile } = useUserStore();
    const { metrics, achievements } = useAnalyticsStore();

    // --- STUDENT STATS ---
    const studentStats = [
        { icon: Clock, label: 'Learning Hours', value: metrics.totalHours, color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: BookOpen, label: 'Topics Completed', value: metrics.topicsCompleted, color: 'text-green-500', bg: 'bg-green-50' },
        { icon: Flame, label: 'Current Streak', value: `${metrics.streakDays} days`, color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: TrendingUp, label: 'Avg. Quiz Score', value: `${metrics.averageQuizScore}%`, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    // --- TEACHER STATS (Mock) ---
    const teacherStats = [
        { icon: Book, label: 'Classes Taught', value: '124', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { icon: Users, label: 'Total Students', value: '85', color: 'text-pink-500', bg: 'bg-pink-50' },
        { icon: Star, label: 'Avg. Rating', value: '4.8/5', color: 'text-amber-500', bg: 'bg-amber-50' },
        { icon: Clock, label: 'Teaching Hours', value: '320h', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    // --- ADMIN STATS (Mock) ---
    const adminStats = [
        { icon: Users, label: 'Active Users', value: '1,240', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Activity, label: 'System Health', value: '99.9%', color: 'text-green-600', bg: 'bg-green-50' },
        { icon: AlertCircle, label: 'Open Tickets', value: '5', color: 'text-red-500', bg: 'bg-red-50' },
        { icon: Shield, label: 'Security Status', value: 'Secure', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    // Select stats based on role
    const currentStats = role === 'teacher' ? teacherStats : role === 'admin' ? adminStats : studentStats;

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Atmospheric Background Blobs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative z-10 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onClose ? (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                            </button>
                        ) : (
                            <Link
                                to={routes.dashboard}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                            </Link>
                        )}
                        {onClose ? (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 group"
                                aria-label="Aɪra home"
                            >
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">Aɪra</span>
                            </button>
                        ) : (
                            <Link
                                to={routes.dashboard}
                                className="flex items-center gap-2 group"
                                aria-label="Aɪra home"
                            >
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">Aɪra</span>
                            </Link>
                        )}
                    </div>

                    <h1 className="hidden md:block text-xl font-bold text-gray-800 dark:text-slate-100 flex-1 text-center">
                        {role === 'student' ? 'My Profile' : role === 'teacher' ? 'Teacher Profile' : 'Admin Profile'}
                    </h1>

                    <div className="flex items-center gap-2">
                        {role === 'student' && (
                            onClose ? (
                                <button
                                    onClick={onClose}
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Continue Learning
                                </button>
                            ) : (
                                <Link
                                    to={routes.dashboard}
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Continue Learning
                                </Link>
                            )
                        )}
                        {!onClose && (
                            <Link
                                to={routes.settings}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Settings"
                            >
                                <Settings className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                            </Link>
                        )}
                    </div>
                </div>
            </header >

            <PageTransition className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                {/* Profile Card - Responsive */}
                <motion.div
                    className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-start gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold shadow-xl border-4 border-white/50 dark:border-slate-800/50">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <button
                                className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all border border-gray-100 dark:border-slate-700 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                aria-label="Edit profile"
                            >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 truncate">{user?.name || 'User'}</h2>
                            <p className="text-purple-600 dark:text-purple-300 font-medium text-sm sm:text-base truncate uppercase tracking-wide">
                                {role}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {user?.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {profile?.timezone || 'GMT+0'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {!onClose && (
                            <Link
                                to={routes.settings}
                                className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300 font-medium inline-block"
                            >
                                Edit Profile
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Shared Stats Grid */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {currentStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-white/40 dark:border-white/10 group hover:scale-[1.02] transition-transform duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={`w-6 h-6 ${stat.color} drop-shadow-sm`} />
                            </div>
                            <p className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">{stat.value}</p>
                            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* --- STUDENT SPECIFIC CONTENT --- */}
                {role === 'student' && (
                    <>
                        {/* Student Learning Style */}
                        <motion.div
                            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-purple-500" />
                                Learning Style
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { label: 'Visual', value: profile?.learningStyle?.visual || 70, color: 'bg-blue-500' },
                                    { label: 'Auditory', value: profile?.learningStyle?.auditory || 20, color: 'bg-green-500' },
                                    { label: 'Kinesthetic', value: profile?.learningStyle?.kinesthetic || 10, color: 'bg-orange-500' },
                                ].map((style) => (
                                    <div key={style.label}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-gray-600 dark:text-slate-400 font-medium">{style.label}</span>
                                            <span className="font-bold text-gray-800 dark:text-slate-100">{style.value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200/50 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div className={`${style.color} h-full rounded-full transition-all liquid-shine`} style={{ width: `${style.value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Student Achievements */}
                        <motion.div
                            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-500" />
                                Achievements
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {achievements.map((achievement) => (
                                    <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${achievement.unlockedAt ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                                        <span className="text-2xl">{achievement.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{achievement.name}</p>
                                            <p className="text-xs text-gray-500">{achievement.description}</p>
                                        </div>
                                        {achievement.unlockedAt && <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* --- TEACHER SPECIFIC CONTENT --- */}
                {role === 'teacher' && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Schedule Widget */}
                        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Today's Schedule
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { time: '09:00 AM', subject: 'Mathematics', class: 'Grade 9A', room: 'Room 302' },
                                    { time: '11:30 AM', subject: 'Physics', class: 'Grade 10B', room: 'Lab 2' },
                                    { time: '02:00 PM', subject: 'Mathematics', class: 'Grade 9B', room: 'Room 304' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="w-20 text-sm font-bold text-gray-500">{item.time}</div>
                                        <div className="flex-1 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300">{item.subject}</h4>
                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">{item.class} • {item.room}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Reviews/Performance */}
                        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" />
                                Recent Feedback
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { msg: "The explanation of Trigonometry was super clear!", rating: 5, time: "2h ago" },
                                    { msg: "Helped me understand Quadratic formulas finally.", rating: 5, time: "5h ago" },
                                    { msg: "Good class, but moved a bit fast.", rating: 4, time: "1d ago" },
                                ].map((review, idx) => (
                                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between mb-1">
                                            <div className="flex text-amber-500">
                                                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                            </div>
                                            <span className="text-xs text-gray-400">{review.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 italic">"{review.msg}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- ADMIN SPECIFIC CONTENT --- */}
                {role === 'admin' && (
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Audit Log */}
                        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                System Audit Log
                            </h3>
                            <div className="space-y-0 divide-y divide-gray-100 dark:divide-slate-700">
                                {[
                                    { action: "User Login", user: "Sarah Teacher", time: "10 mins ago", status: "Success", color: "text-green-600" },
                                    { action: "Grade Update", user: "Mr. Wilson", time: "25 mins ago", status: "Success", color: "text-green-600" },
                                    { action: "Failed Login", user: "Unknown (IP: 192.168...)", time: "1 hour ago", status: "Blocked", color: "text-red-500" },
                                    { action: "New Registration", user: "Student #4092", time: "2 hours ago", status: "Success", color: "text-green-600" },
                                ].map((log, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{log.action}</p>
                                                <p className="text-xs text-gray-500">{log.user}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-500" />
                                Quick Governance
                            </h3>
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200">
                                    <Users className="w-4 h-4 text-purple-600" /> Manage Users
                                </button>
                                <button className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200">
                                    <Activity className="w-4 h-4 text-emerald-600" /> System Status
                                </button>
                                <button className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200">
                                    <Shield className="w-4 h-4 text-blue-600" /> Security Logs
                                </button>
                                <button className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-200">
                                    <Settings className="w-4 h-4 text-gray-600" /> Global Settings
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </PageTransition>
        </div>
    </div>
);
}
