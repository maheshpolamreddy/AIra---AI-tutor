import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';
import { toast } from '../stores/toastStore';
import type { AppRole } from '../types';

const ROLES: {
  role: AppRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  enter: () => void;
  home: string;
  accent: string;
}[] = [
  {
    role: 'student',
    label: 'Student',
    description: 'Learn with curriculum and competitive prep',
    icon: GraduationCap,
    enter: () => useAuthStore.getState().enterStudentDemo(),
    home: studentRoutes.modeSelection,
    accent: 'from-amber-400 to-orange-500',
  },
  {
    role: 'teacher',
    label: 'Teacher',
    description: 'Class insights and student performance',
    icon: BookOpen,
    enter: () => useAuthStore.getState().enterTeacherDemo(),
    home: teacherRoutes.dashboard,
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'School-wide analytics and controls',
    icon: Building2,
    enter: () => useAuthStore.getState().enterAdminDemo(),
    home: adminRoutes.dashboard,
    accent: 'from-pink-500 to-rose-600',
  },
];

function homeForRole(role: AppRole | null): string {
  if (role === 'teacher') return teacherRoutes.dashboard;
  if (role === 'admin') return adminRoutes.dashboard;
  return studentRoutes.modeSelection;
}

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const clearSelection = useCurriculumStore((s) => s.clearSelection);

  useEffect(() => {
    if (!isAuthenticated || !role) return;
    navigate(homeForRole(role), { replace: true });
  }, [isAuthenticated, role, navigate]);

  const handleSelect = (entry: (typeof ROLES)[number]) => {
    clearSelection();
    entry.enter();
    toast.success(`Welcome, ${entry.label}!`);
    navigate(entry.home);
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center px-4 safe-top safe-bottom safe-x font-sans text-slate-800">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 tracking-tight mb-2">
          Aɪra
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-medium mb-10 text-center">
          Choose how you want to continue
        </p>

        <div className="w-full space-y-3">
          {ROLES.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <motion.button
                key={entry.role}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(entry)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-lg hover:bg-white/70 transition-colors text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.accent} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{entry.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{entry.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
