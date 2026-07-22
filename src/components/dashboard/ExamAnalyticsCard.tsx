
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap } from 'lucide-react';

export default function ExamAnalyticsCard() {
    // Mock data for the graph
    const weeklyScores = [65, 68, 72, 70, 75, 78, 82];
    const currentReadiness = 82;

    return (
        <motion.div
            className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl border border-white/30 dark:border-slate-800/50 group cursor-default"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{ perspective: "1000px" }}
        >
            {/* Holographic AI Scan Line */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-20 w-full pointer-events-none z-20"
                animate={{ top: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Background "Energy" Particles */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                        animate={{
                            y: [0, -100],
                            x: [0, (Math.random() - 0.5) * 50],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                {/* Left Section: Liquid Gauge */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-40 h-40">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]" />

                        {/* The Liquid Sphere */}
                        <div className="absolute inset-2 rounded-full overflow-hidden bg-slate-100/50 dark:bg-slate-800/50 border border-white/20">
                            {/* Water/Liquid Fill */}
                            <motion.div
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-400"
                                initial={{ height: 0 }}
                                animate={{ height: `${currentReadiness}%` }}
                                transition={{ duration: 2, ease: "circOut" }}
                            >
                                {/* Ripple Animation 1 */}
                                <motion.div
                                    className="absolute -top-6 left-[-50%] w-[200%] h-12 bg-indigo-400/50 rounded-[40%]"
                                    animate={{ rotate: 360, x: ["-10%", "10%"] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                />
                                {/* Ripple Animation 2 */}
                                <motion.div
                                    className="absolute -top-8 left-[-40%] w-[190%] h-14 bg-indigo-300/30 rounded-[35%]"
                                    animate={{ rotate: -360, x: ["10%", "-10%"] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>

                            {/* Center Value */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    className="text-4xl font-black text-slate-800 dark:text-white drop-shadow-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    {currentReadiness}%
                                </motion.span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Readiness</span>
                            </div>
                        </div>

                        {/* Floating Status Badge */}
                        <motion.div
                            className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-lg border-2 border-white"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            ELITE
                        </motion.div>
                    </div>
                </div>

                {/* Right Section: Interactive Components */}
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                <Target className="w-6 h-6 text-indigo-500 animate-pulse" />
                                Exam Mission
                            </h2>
                            <p className="text-xs font-bold text-slate-400">TARGET: JEE MAIN 2026</p>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                            <TrendingUp className="w-4 h-4" />
                            <span>+12.4%</span>
                        </div>
                    </div>

                    {/* Animated Bar Chart with "Warp" Effect */}
                    <div className="h-28 w-full flex items-end gap-1.5 relative overflow-hidden px-2 py-4 bg-slate-500/5 rounded-2xl">
                        {weeklyScores.map((score, i) => (
                            <div key={i} className="flex-1 relative group h-full">
                                <motion.div
                                    className="absolute bottom-0 w-full rounded-full bg-indigo-500/20"
                                    initial={{ height: 0 }}
                                    animate={{ height: "100%" }}
                                />
                                <motion.div
                                    className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-indigo-600 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${score}%` }}
                                    transition={{
                                        delay: 0.5 + i * 0.1,
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 10
                                    }}
                                    whileHover={{ width: "120%", x: "-10%", filter: "brightness(1.2)" }}
                                >
                                    {/* Glowing Cap */}
                                    <div className="absolute top-0 w-full h-1 bg-white/50 rounded-full blur-[1px]" />
                                </motion.div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 group/stat"
                            whileHover={{ y: -5, backgroundColor: "rgba(99,102,241,0.15)" }}
                        >
                            <div className="flex items-center gap-2 mb-2 text-indigo-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Efficiency</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-800 dark:text-white">1.2</span>
                                <span className="text-[10px] font-black text-slate-400">MIN/Q</span>
                            </div>
                        </motion.div>
                        <motion.div
                            className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 group/stat"
                            whileHover={{ y: -5, backgroundColor: "rgba(168,85,247,0.15)" }}
                        >
                            <div className="flex items-center gap-2 mb-2 text-purple-500">
                                <Zap className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Accuracy</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-800 dark:text-white">88</span>
                                <span className="text-[10px] font-black text-slate-400">% AVG</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
