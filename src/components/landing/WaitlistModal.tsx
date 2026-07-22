import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from '../../stores/toastStore';

interface WaitlistModalProps {
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ courseName, isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmed, courseName }) });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      toast.success(`You're on the list! We'll notify you when ${courseName} launches.`);
      setEmail('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join waitlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1 pr-8">Notify Me</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Be the first to know when <span className="font-semibold text-indigo-600 dark:text-indigo-400">{courseName}</span> launches.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input id="waitlist-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Notify Me'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
