import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

interface FullPageLoaderProps {
    message?: string;
}

export default function FullPageLoader({ message = 'Loading...' }: FullPageLoaderProps) {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
            <motion.div
                className="text-center"
                initial={reduceAnimations ? {} : { opacity: 0, y: 20 }}
                animate={reduceAnimations ? {} : { opacity: 1, y: 0 }}
            >
                <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                    animate={reduceAnimations ? {} : { rotate: 360 }}
                    transition={reduceAnimations ? {} : { duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-gray-600 dark:text-slate-300 font-medium">{message}</p>
            </motion.div>
        </div>
    );
}
