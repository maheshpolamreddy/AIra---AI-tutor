
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import { toast } from '../stores/toastStore';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';
import { useState, useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const emailLoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSignUpSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    displayName: z.string().trim().min(2, 'Please enter your full name (at least 2 characters)'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const studentLoginSchema = z.object({
  rollNumber: z.string().trim().min(1, 'Roll Number is required'),
  dob: z
    .string()
    .min(1, 'Date of Birth is required')
    .refine((s) => {
      const ms = Date.parse(s);
      if (Number.isNaN(ms)) return false;
      const d = new Date(`${s}T12:00:00`);
      const now = new Date();
      if (d > now) return false;
      const ageYears = (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return ageYears >= 2 && ageYears <= 120;
    }, 'Please enter a valid date of birth'),
});

const studentSignUpSchema = studentLoginSchema.extend({
  name: z.string().trim().min(2, 'Please enter your full name (at least 2 characters)'),
});

type EmailLoginFormInputs = z.infer<typeof emailLoginSchema>;
type EmailSignUpFormInputs = z.infer<typeof emailSignUpSchema>;
type StudentLoginFormInputs = z.infer<typeof studentLoginSchema>;
type StudentSignUpFormInputs = z.infer<typeof studentSignUpSchema>;
interface LoginFormInputs
  extends Partial<EmailLoginFormInputs>,
    Partial<EmailSignUpFormInputs>,
    Partial<StudentLoginFormInputs>,
    Partial<StudentSignUpFormInputs> {}

// ─────────────────────────────────────────────────────────────────
//  LOGIN MASCOT  — no cap, no eye tracking, button-only reactions
//  Emotion map:
//    'happy'    → default cute smile
//    'laughing' → ^_^ eyes, big open laugh, shaking, HA particles
//    'teacher'  → round professor glasses slide in over static eyes
//    'cool'     → black sunglasses slide down over static eyes + smirk
// ─────────────────────────────────────────────────────────────────
function LoginMascot({ emotion = 'happy' }: {
  emotion?: 'happy' | 'excited' | 'laughing' | 'teacher' | 'cool';
}) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Blink loop — paused while laughing
  useEffect(() => {
    if (emotion === 'laughing') return;
    let alive = true;
    const loop = () => {
      setTimeout(() => {
        if (!alive) return;
        setIsBlinking(true);
        setTimeout(() => { if (alive) { setIsBlinking(false); loop(); } }, 160);
      }, Math.random() * 3500 + 1800);
    };
    loop();
    return () => { alive = false; };
  }, [emotion]);

  const isExcited = emotion === 'excited';
  const isLaughing = emotion === 'laughing';
  const isTeacher = emotion === 'teacher';
  const isCool = emotion === 'cool';

  /*
    SVG geometry (viewBox 220×220):
      Face     cx=110  cy=112  r=100
      Left eye cx=88   cy=100  rx=20  ry=24
      Right eye cx=132 cy=100  rx=20  ry=24

    Glasses math (eye-center gap = 44px):
      Round specs r=19  → inner edge 88+19=107 / 132-19=113  → 6px bridge ✓
      Sunglasses rx=20 ry=16 → inner 88+20=108 / 132-20=112 → 4px bridge ✓
  */

  return (
    <div className="w-full h-full relative select-none flex items-center justify-center">

      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-yellow-300/25 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Float + laugh-shake wrapper */}
      <motion.div
        className="relative w-full h-full"
        animate={isLaughing
          ? { y: [0, -22, -6, -18, 0], rotate: [-5, 5, -4, 4, 0], scale: [1, 1.07, 1, 1.05, 1] }
          : { y: [0, -10, 0], rotate: 0, scale: 1 }
        }
        transition={isLaughing
          ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }
          : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-2xl" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="lmFace" cx="36%" cy="28%" r="72%" fx="36%" fy="28%">
              <stop offset="0%" stopColor="#FFFDE7" />
              <stop offset="36%" stopColor="#FFF176" />
              <stop offset="80%" stopColor="#FBC02D" />
              <stop offset="100%" stopColor="#F57F17" />
            </radialGradient>
            <radialGradient id="lmShade" cx="50%" cy="95%" r="55%">
              <stop offset="0%" stopColor="#B45309" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lmIris" cx="40%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#81D4FA" />
              <stop offset="52%" stopColor="#0288D1" />
              <stop offset="100%" stopColor="#01579B" />
            </radialGradient>
            <filter id="lmBlush"><feGaussianBlur stdDeviation="6" /></filter>
            <filter id="lmGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FCD34D" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* FACE */}
          <circle cx="110" cy="112" r="100" fill="url(#lmShade)" />
          <circle cx="110" cy="112" r="100" fill="url(#lmFace)" />
          <ellipse cx="72" cy="66" rx="46" ry="30" fill="white" opacity="0.2"
            transform="rotate(-20 72 66)" style={{ filter: 'blur(9px)' }} />
          <circle cx="110" cy="112" r="100" fill="none"
            stroke="rgba(249,115,22,0.28)" strokeWidth="2.5" />

          {/* BLUSH — big pink when excited, biggest red when laughing */}
          <circle cx="34" cy="142"
            r={isLaughing ? 28 : isExcited ? 30 : 22}
            fill={isLaughing ? '#FF5252' : isExcited ? '#FF6B9D' : '#FF8A80'}
            opacity={isLaughing ? 0.45 : isExcited ? 0.55 : 0.35}
            filter="url(#lmBlush)" />
          <circle cx="186" cy="142"
            r={isLaughing ? 28 : isExcited ? 30 : 22}
            fill={isLaughing ? '#FF5252' : isExcited ? '#FF6B9D' : '#FF8A80'}
            opacity={isLaughing ? 0.45 : isExcited ? 0.55 : 0.35}
            filter="url(#lmBlush)" />

          {/* EYEBROWS */}
          <motion.path
            d={isLaughing ? 'M70 66 Q88 50 106 66'
              : isExcited ? 'M72 72 Q88 60 104 72'
                : isTeacher ? 'M72 74 Q88 62 104 74'
                  : 'M72 80 Q88 68 104 80'}
            fill="none" stroke="#7C3A00" strokeWidth="5.5"
            strokeLinecap="round" opacity="0.8"
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
          />
          <motion.path
            d={isLaughing ? 'M114 66 Q132 50 150 66'
              : isExcited ? 'M116 72 Q132 60 148 72'
                : isTeacher ? 'M116 74 Q132 62 148 74'
                  : 'M116 80 Q132 68 148 80'}
            fill="none" stroke="#7C3A00" strokeWidth="5.5"
            strokeLinecap="round" opacity="0.8"
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
          />

          {/* EYES */}
          <AnimatePresence mode="sync">
            {isLaughing ? (
              /* UwU laughing arcs */
              <motion.g key="laugh-eyes"
                initial={{ opacity: 0, scaleY: 0.4 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.4 }}
                transition={{ type: 'spring', stiffness: 600, damping: 16 }}
              >
                <path d="M68 98 Q88 122 108 98"
                  stroke="#5D2E0C" strokeWidth="9" fill="none" strokeLinecap="round" />
                <path d="M112 98 Q132 122 152 98"
                  stroke="#5D2E0C" strokeWidth="9" fill="none" strokeLinecap="round" />
                {/* Stars */}
                <motion.text x="156" y="86" fontSize="18" textAnchor="middle" filter="url(#lmGlow)"
                  animate={{ y: [86, 74, 86], rotate: [0, 25, 0], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}>★</motion.text>
                <motion.text x="56" y="80" fontSize="15" textAnchor="middle" filter="url(#lmGlow)"
                  animate={{ y: [80, 68, 80], rotate: [0, -20, 0], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 0.55, repeat: Infinity, delay: 0.15 }}>✦</motion.text>
              </motion.g>
            ) : isBlinking ? (
              /* Blink */
              <motion.g key="blink"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.06 }}>
                <path d="M72 100 Q88 112 104 100"
                  stroke="#7C3A00" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                <path d="M116 100 Q132 112 148 100"
                  stroke="#7C3A00" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              </motion.g>
            ) : (
              /* Static normal eyes — no tracking */
              <motion.g key="normal-eyes"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}>
                <ellipse cx="88" cy="100" rx="20" ry="24" fill="white" />
                <circle cx="88" cy="102" r="13" fill="url(#lmIris)" />
                <circle cx="91" cy="106" r="5.5" fill="#001929" />
                <circle cx="80" cy="91" r="5" fill="white" />
                <circle cx="94" cy="95" r="2" fill="white" opacity="0.7" />
                <ellipse cx="132" cy="100" rx="20" ry="24" fill="white" />
                <circle cx="132" cy="102" r="13" fill="url(#lmIris)" />
                <circle cx="135" cy="106" r="5.5" fill="#001929" />
                <circle cx="124" cy="91" r="5" fill="white" />
                <circle cx="138" cy="95" r="2" fill="white" opacity="0.7" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── TEACHER ROUND SPECS ──
              r=19 → inner edge at 107/113 → 6px bridge         */}
          <AnimatePresence>
            {isTeacher && !isBlinking && (
              <motion.g key="teacher-glasses"
                initial={{ opacity: 0, scale: 0.75, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: -8 }}
                transition={{ type: 'spring', stiffness: 700, damping: 20 }}
                style={{ transformOrigin: '110px 100px' }}
              >
                {/* Lenses */}
                <circle cx="88" cy="100" r="19"
                  fill="rgba(200,235,255,0.25)" stroke="#374151" strokeWidth="4" />
                <circle cx="132" cy="100" r="19"
                  fill="rgba(200,235,255,0.25)" stroke="#374151" strokeWidth="4" />
                {/* Bridge (connects inner edges at x=107 and x=113) */}
                <path d="M107 100 L113 100"
                  stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
                {/* Arms (from outer edge outward) */}
                <path d="M69 100 L57 97"
                  stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M151 100 L163 97"
                  stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
                {/* Lens shine */}
                <circle cx="79" cy="91" r="5" fill="white" opacity="0.35" />
                <circle cx="123" cy="91" r="5" fill="white" opacity="0.35" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── ADMIN COOL SUNGLASSES ──
              rx=20 ry=16 → inner edge at 108/112 → 4px bridge  */}
          <AnimatePresence>
            {isCool && !isBlinking && (
              <motion.g key="cool-glasses"
                initial={{ opacity: 0, scale: 0.72, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.72, y: -8 }}
                transition={{ type: 'spring', stiffness: 700, damping: 20 }}
                style={{ transformOrigin: '110px 100px' }}
              >
                {/* Lenses */}
                <ellipse cx="88" cy="100" rx="20" ry="16" fill="#111827" />
                <ellipse cx="132" cy="100" rx="20" ry="16" fill="#111827" />
                {/* Bridge (fills tiny gap between lenses) */}
                <rect x="108" y="96" width="4" height="8" fill="#111827" />
                {/* Arms */}
                <path d="M68 100 L55 97"
                  stroke="#111827" strokeWidth="5" strokeLinecap="round" />
                <path d="M152 100 L165 97"
                  stroke="#111827" strokeWidth="5" strokeLinecap="round" />
                {/* Glare */}
                <ellipse cx="76" cy="92" rx="7" ry="4"
                  fill="white" opacity="0.22" transform="rotate(-22 76 92)" />
                <ellipse cx="120" cy="92" rx="7" ry="4"
                  fill="white" opacity="0.22" transform="rotate(-22 120 92)" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* MOUTH */}
          <AnimatePresence mode="sync">
            {isExcited ? (
              /* Big wide smile with heart eyes vibe — no open mouth */
              <motion.path key="excited-smile"
                d="M72 150 Q110 186 148 150"
                fill="none" stroke="#7C3A00" strokeWidth="7" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
            ) : isLaughing ? (
              <motion.g key="laugh-mouth"
                initial={{ scaleY: 0.3, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0.3, opacity: 0 }}
                style={{ transformOrigin: '110px 153px' }}
                transition={{ type: 'spring', stiffness: 700, damping: 18 }}
              >
                {/* Outer D-shape */}
                <path d="M68 148 Q110 202 152 148 Z" fill="#5D2E0C" />
                {/* Top teeth */}
                <path d="M74 151 Q110 190 146 151 L146 163 Q110 176 74 163 Z" fill="white" />
                {/* Tongue */}
                <ellipse cx="110" cy="176" rx="18" ry="10" fill="#E57373" opacity="0.85" />
                <ellipse cx="105" cy="172" rx="6" ry="4" fill="white" opacity="0.25" />
              </motion.g>
            ) : isCool ? (
              <motion.path key="smirk"
                d="M92 154 Q118 163 142 149"
                fill="none" stroke="#7C3A00" strokeWidth="5.5" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.35 }}
              />
            ) : (
              <motion.path key="smile"
                d="M82 152 Q110 172 138 152"
                fill="none" stroke="#7C3A00" strokeWidth="5.5" strokeLinecap="round"
                animate={{ scaleY: [1, 1.12, 1] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* LAUGH "HA!" PARTICLES */}
          <AnimatePresence>
            {isLaughing && (
              <motion.g key="ha-particles">
                {[
                  { txt: 'HA!', x: 170, y: 95, delay: 0 },
                  { txt: 'HA!', x: 36, y: 105, delay: 0.18 },
                  { txt: 'HA!', x: 182, y: 136, delay: 0.34 },
                ].map((p, i) => (
                  <motion.text key={i} x={p.x} y={p.y}
                    textAnchor="middle"
                    fontSize="17" fontWeight="900" fill="#F59E0B"
                    fontFamily="system-ui, sans-serif"
                    filter="url(#lmGlow)"
                    initial={{ opacity: 0, y: p.y + 14, scale: 0.4 }}
                    animate={{ opacity: [0, 1, 1, 0], y: p.y - 26, scale: [0.4, 1.3, 1.1, 0.7] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
                  >{p.txt}</motion.text>
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>
    </div>
  );
}

// ─── Cloud ───────────────────────────────────
function Cloud({ className, delay = 0, scale = 1, duration = 20 }: {
  className?: string; delay?: number; scale?: number; duration?: number;
}) {
  return (
    <motion.div
      className={`absolute opacity-80 ${className}`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: ['-10%', '110%'], y: [0, -20, 0, 20, 0] }}
      transition={{
        x: { duration, repeat: Infinity, ease: 'linear', delay },
        y: { duration: duration / 2, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{ scale }}
    >
      <div className="relative">
        <div className="w-24 h-24 bg-white/40 blur-xl rounded-full absolute top-0 left-0" />
        <div className="w-32 h-32 bg-white/50 blur-xl rounded-full absolute -top-12 left-10" />
        <div className="w-24 h-24 bg-white/40 blur-xl rounded-full absolute -top-4 left-28" />
        <div className="w-40 h-16 bg-white/30 blur-xl rounded-full absolute top-8 left-4" />
      </div>
    </motion.div>
  );
}

// ─── Sunglasses icon ─────────────────────────
function SunglassesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7" cy="12" rx="4.5" ry="3.5" />
      <ellipse cx="17" cy="12" rx="4.5" ry="3.5" />
      <path d="M10.5 12h3" /><path d="M2.5 12H0" /><path d="M21.5 12H24" />
    </svg>
  );
}

// ─── Sparkle ─────────────────────────────────
function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute text-white/80 text-2xl ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeOut' }}
    >✨</motion.div>
  );
}

// ─── Login Button ────────────────────────────
interface LoginButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  theme: 'student' | 'teacher' | 'admin';
  onHover: () => void;
  onLeave: () => void;
}

const LoginButton = ({ onClick, icon: Icon, label, theme, onHover, onLeave }: LoginButtonProps) => {
  const themes = {
    student: { iconColor: 'text-amber-600', borderColor: 'border-white/40 hover:border-orange-300/60', accent: 'bg-amber-400/20' },
    teacher: { iconColor: 'text-indigo-600', borderColor: 'border-white/40 hover:border-indigo-300/60', accent: 'bg-indigo-400/20' },
    admin: { iconColor: 'text-pink-600', borderColor: 'border-white/40 hover:border-pink-300/60', accent: 'bg-pink-400/20' },
  };
  const t = themes[theme];

  return (
    <motion.button
      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative w-full overflow-hidden group flex items-center px-4 py-3
        bg-white/40 backdrop-blur-md rounded-2xl
        shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
        transition-all duration-500 border-t border-l ${t.borderColor}
        hover:-translate-y-1 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.12)]`}
      whileTap={{ scale: 0.97 }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/50 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/20 to-transparent" />
      <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0
        transition-all duration-500 ${t.accent} group-hover:bg-white/30 backdrop-blur-sm
        border border-white/20 group-hover:rotate-6 ${t.iconColor}`}>
        <Icon className="w-6 h-6 transition-transform duration-500 group-hover:scale-110" />
      </div>
      <span className="relative z-10 text-slate-800 font-bold text-lg flex-1 text-center
        tracking-tight group-hover:scale-105 group-hover:text-slate-900 transition-all duration-500">
        {label}
      </span>
      <div className="w-11 shrink-0" aria-hidden="true" />
      <div className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0
        translate-x-4 transition-all duration-500 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center
          backdrop-blur-sm border border-white/40 shadow-sm text-slate-800">
          <span className="text-xl font-light">→</span>
        </div>
      </div>
    </motion.button>
  );
};

// ─── Auth Form ───────────────────────────────
function AuthForm({ role, onBack, theme }: { role: 'student' | 'teacher' | 'admin'; onBack: () => void; theme: 'student' | 'teacher' | 'admin' }) {
  const [isLogin, setIsLogin] = useState(true);
  const { loginWithEmail, signUpWithEmail, loginWithRollNumber, signUpWithRollNumber, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const clearSelection = useCurriculumStore(state => state.clearSelection);
  
  const isStudent = role === 'student';

  const resolver = useMemo(() => {
    const schema = isStudent
      ? isLogin
        ? studentLoginSchema
        : studentSignUpSchema
      : isLogin
        ? emailLoginSchema
        : emailSignUpSchema;
    return zodResolver(schema) as Resolver<LoginFormInputs>;
  }, [isStudent, isLogin]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      rollNumber: '',
      dob: '',
      name: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      if (isLogin) {
        if (isStudent) {
          await loginWithRollNumber(data.rollNumber!, data.dob!);
        } else {
          await loginWithEmail(data.email!, data.password!, role);
        }
        toast.success(`Welcome back, ${role}!`);
      } else {
        if (isStudent) {
          await signUpWithRollNumber(data.rollNumber!, data.dob!, data.name!);
        } else {
          await signUpWithEmail(data.email!, data.password!, data.displayName!, role);
        }
        toast.success('Account created successfully!');
      }

      clearSelection();

      if (role === 'student') navigate(studentRoutes.modeSelection);
      if (role === 'teacher') navigate(teacherRoutes.dashboard);
      if (role === 'admin') navigate(adminRoutes.dashboard);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Authentication failed');
    }
  };

  const btnBg = theme === 'student' ? 'bg-amber-500 hover:bg-amber-600' :
    theme === 'teacher' ? 'bg-indigo-600 hover:bg-indigo-700' :
      'bg-pink-600 hover:bg-pink-700';
  const textClr = theme === 'student' ? 'text-amber-700' :
    theme === 'teacher' ? 'text-indigo-700' :
      'text-pink-700';

  return (
    <motion.form
      key={isLogin ? 'login' : 'signup'}
      onSubmit={handleSubmit(onSubmit)}
      className="w-full bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/40 space-y-4"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onBack} disabled={isLoading} className="p-2 hover:bg-white/40 rounded-full transition-colors flex shrink-0">
          <span className="text-xl">←</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-800 capitalize leading-tight">{isLogin ? 'Login as' : 'Sign up as'}<br /><span className={textClr}>{role}</span></h2>
      </div>

      <div className="space-y-4">
        {!isLogin && isStudent && (
          <div>
            <label htmlFor="auth-student-name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              id="auth-student-name"
              autoComplete="name"
              {...register('name')}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-amber-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400"
              placeholder="Student Name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1" role="alert">{errors.name.message}</p>}
          </div>
        )}

        {!isLogin && !isStudent && (
          <div>
            <label htmlFor="auth-display-name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              id="auth-display-name"
              autoComplete="name"
              {...register('displayName')}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400"
              placeholder={role === 'teacher' ? 'Your name as it appears on the profile' : 'Your name'}
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1" role="alert">{errors.displayName.message}</p>
            )}
          </div>
        )}

        {isStudent ? (
          <>
            <div>
              <label htmlFor="auth-roll" className="block text-sm font-semibold text-slate-700 mb-1">Roll Number</label>
              <input
                id="auth-roll"
                autoComplete="username"
                {...register('rollNumber')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-amber-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400 font-mono"
                placeholder="Enter Roll Number"
              />
              {errors.rollNumber && <p className="text-red-500 text-sm mt-1" role="alert">{errors.rollNumber.message}</p>}
            </div>
            <div>
              <label htmlFor="auth-dob" className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth (DOB)</label>
              <input
                id="auth-dob"
                type="date"
                {...register('dob')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-amber-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400 cursor-pointer"
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1" role="alert">{errors.dob.message}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="auth-email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1" role="alert">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                disabled={isLoading}
                {...register('password')}
                className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1" role="alert">{errors.password.message}</p>}
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-semibold text-slate-700 mb-1">Confirm password</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('confirmPassword')}
                  className="w-full px-4 py-2 rounded-xl border border-white/50 shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur outline-none transition-all placeholder:text-slate-400"
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1" role="alert">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button type="submit" disabled={isLoading} className={`w-full py-3 mt-4 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 ${btnBg}`}>
        {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
      </button>

      <div className="text-center mt-4">
        <button type="button" disabled={isLoading} onClick={() => setIsLogin(!isLogin)} className={`text-sm hover:underline font-medium ${textClr}`}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>

      {/* Demo Fast Forwards - Important to keep for showcasing ease of use during audit/demos if bypass is wanted */}
      <div className="pt-4 mt-6 border-t border-white/40 text-center">
        <p className="text-xs text-slate-500 mb-2">Or continue with demo access</p>
        <button type="button" disabled={isLoading} onClick={async () => {
          const authStore = useAuthStore.getState();
          if (role === 'student') { clearSelection(); authStore.enterStudentDemo(); toast.success('Welcome back, Student!'); navigate(studentRoutes.modeSelection); }
          if (role === 'teacher') { clearSelection(); authStore.enterTeacherDemo(); toast.success('Welcome back, Teacher!'); navigate(teacherRoutes.dashboard); }
          if (role === 'admin') { clearSelection(); authStore.enterAdminDemo(); toast.success('Welcome back, Admin!'); navigate(adminRoutes.dashboard); }
        }} className="text-xs font-semibold bg-white/50 hover:bg-white/80 py-2 px-4 rounded-lg transition-all text-slate-600">
          Fast-forward Demo {role}
        </button>
      </div>
    </motion.form>
  )
}

// ─── Main Page ───────────────────────────────
export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [mascotEmotion, setMascotEmotion] = useState<'happy' | 'excited' | 'laughing' | 'teacher' | 'cool'>('happy');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authRole = useAuthStore((state) => state.role);

  // Already signed in? Go straight to the role home instead of showing a stale login screen.
  useEffect(() => {
    if (!isAuthenticated || !authRole) return;
    const home = authRole === 'teacher'
      ? teacherRoutes.dashboard
      : authRole === 'admin'
        ? adminRoutes.dashboard
        : studentRoutes.modeSelection;
    navigate(home, { replace: true });
  }, [isAuthenticated, authRole, navigate]);

  const handleRoleSelect = (role: 'student' | 'teacher' | 'admin') => {
    setSelectedRole(role);
    if (role === 'student') setMascotEmotion('excited');
    if (role === 'teacher') setMascotEmotion('teacher');
    if (role === 'admin') setMascotEmotion('cool');
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center px-4 safe-top safe-bottom safe-x font-sans text-slate-800 selection:bg-purple-200 transform-gpu" style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(0)' }}>

      {/* Background */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300 pointer-events-none transform-gpu"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: '200% 200%', willChange: 'background-position', transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none transform-gpu" style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />

      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        <motion.div className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] rounded-full bg-indigo-400/30 blur-[100px] transform-gpu"
          style={{ willChange: 'transform', WebkitBackfaceVisibility: 'hidden' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[-10%] right-[-10%] w-[70vh] h-[70vh] rounded-full bg-pink-400/30 blur-[100px] transform-gpu"
          style={{ willChange: 'transform', WebkitBackfaceVisibility: 'hidden' }}
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Cloud className="top-[10%]" delay={0} duration={45} scale={0.6} />
        <Cloud className="top-[40%]" delay={15} duration={50} scale={0.5} />
        <Cloud className="top-[70%]" delay={7} duration={55} scale={0.7} />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
        <Cloud className="top-[20%]" delay={5} duration={35} scale={1.2} />
        <Cloud className="bottom-[15%]" delay={20} duration={30} scale={1.0} />
      </div>

      {/* Sparkles */}
      <Sparkle className="top-24 left-1/4" delay={0} />
      <Sparkle className="top-40 right-1/4" delay={1} />
      <Sparkle className="bottom-32 left-10" delay={2} />
      <Sparkle className="top-10 right-10" delay={1.5} />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
        initial="hidden" animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
      >
        {/* Mascot */}
        <motion.div
          variants={{ hidden: { scale: 0.7, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 220, damping: 14 } } }}
          className="relative mb-6 sm:mb-4 shrink-0 cursor-pointer flex justify-center items-center w-full"
          whileHover={{ scale: 1.04 }}
          onClick={() => setMascotEmotion(p => p === 'happy' ? 'laughing' : 'happy')}
        >
          {/* Inner rigid constraint block dictates exact width mathematically */}
          <div className="relative flex justify-center items-center w-[180px] h-[200px] sm:w-[220px] sm:h-[240px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/0 via-yellow-200/50 to-orange-200/50 blur-3xl scale-125 translate-y-4" />
            
            <div className="relative z-10 w-full h-full flex justify-center items-center">
              <LoginMascot emotion={mascotEmotion} />
            </div>

            {/* Speech bubble bound correctly outside the face edge */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
              className="absolute left-[70%] sm:left-[80%] top-4 sm:top-2 bg-white/95 backdrop-blur-md text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg text-indigo-600 rotate-12 border border-white whitespace-nowrap z-20 pointer-events-none"
            >
              Hi there!
              <div className="absolute -bottom-1 left-3 sm:left-4 w-2 h-2 bg-white rotate-45" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title & Tagline */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } }}
          className="flex flex-col items-center gap-1.5 mb-10 sm:mb-12 w-full text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 tracking-tight drop-shadow-sm leading-[1.1]">
            Aɪra
          </h1>
          <p className="text-slate-600 text-sm sm:text-lg font-medium tracking-wide text-center">Your Intelligent Learning Companion</p>
        </motion.div>

        {/* Login Buttons or Forms */}
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div key="buttons" className="w-full space-y-4" initial="hidden" animate="visible" exit="hidden" variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } } }}>
              <LoginButton
                onClick={() => handleRoleSelect('student')} icon={GraduationCap} label="Student Login" theme="student"
                onHover={() => setMascotEmotion('excited')}
                onLeave={() => setMascotEmotion('happy')}
              />
              <LoginButton
                onClick={() => handleRoleSelect('teacher')} icon={BookOpen} label="Teacher Login" theme="teacher"
                onHover={() => setMascotEmotion('teacher')}
                onLeave={() => setMascotEmotion('happy')}
              />
              <LoginButton
                onClick={() => handleRoleSelect('admin')} icon={SunglassesIcon} label="Admin/Principal Login" theme="admin"
                onHover={() => setMascotEmotion('cool')}
                onLeave={() => setMascotEmotion('happy')}
              />
            </motion.div>
          ) : (
            <motion.div key="form" className="w-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <AuthForm
                role={selectedRole}
                theme={selectedRole}
                onBack={() => {
                  setSelectedRole(null);
                  setMascotEmotion('happy');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>


      </motion.div>
    </div>
  );
}
