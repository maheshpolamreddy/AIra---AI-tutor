import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { useTeachingStore } from './stores/teachingStore';
import { changeLanguage } from './i18n';
import ErrorBoundary from './components/common/ErrorBoundary';
import FullPageLoader from './components/common/FullPageLoader';
import ToastContainer from './components/common/Toast';
import { useToastStore } from './stores/toastStore';
import { getRoleFromPath, studentRoutes, teacherRoutes, adminRoutes } from './utils/routes';
import type { AppRole } from './types';
import ScrollToTop from './components/common/ScrollToTop';
import { unlockAudioContext } from './hooks/useSpeech';

// Lazy load pages for better performance (code-splitting)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const TeachingPage = lazy(() => import('./pages/TeachingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage'));
const StudentModeSelectionPage = lazy(() => import('./pages/StudentModeSelectionPage'));
const StudentCompetitivePage = lazy(() => import('./pages/StudentCompetitivePage'));
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const CompetitiveTeachingPage = lazy(() => import('./pages/CompetitiveTeachingPage'));

// Protected route wrapper: requires authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no role (legacy session), set default and redirect to student
  if (!role) {
    return <Navigate to={studentRoutes.dashboard} replace />;
  }

  return <>{children}</>;
}

// Role guard: ensures user's role matches the route prefix (/student, /teacher, /admin)
function RoleGuard({ allowedRole, children }: { allowedRole: AppRole; children: React.ReactNode }) {
  const role = useAuthStore((state) => state.role);
  const location = useLocation();
  const pathRole = getRoleFromPath(location.pathname);

  if (role !== allowedRole || pathRole !== allowedRole) {
    const home = role === 'student' ? studentRoutes.modeSelection : role === 'teacher' ? teacherRoutes.dashboard : adminRoutes.dashboard;
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}

// Settings effect hook to apply settings globally
function SettingsEffect() {
  const settings = useSettingsStore((state) => state.settings);
  const setTeachingSpeaking = useTeachingStore((state) => state.setSpeaking);

  useEffect(() => {
    const html = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    // Apply theme
    if (settings.theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      themeColorMeta?.setAttribute('content', '#020617');
    } else if (settings.theme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      themeColorMeta?.setAttribute('content', '#a855f7');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        themeColorMeta?.setAttribute('content', '#020617');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        themeColorMeta?.setAttribute('content', '#a855f7');
      }

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          html.classList.add('dark');
          html.setAttribute('data-theme', 'dark');
          themeColorMeta?.setAttribute('content', '#020617');
        } else {
          html.classList.remove('dark');
          html.setAttribute('data-theme', 'light');
          themeColorMeta?.setAttribute('content', '#a855f7');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  useEffect(() => {
    // Apply font size
    const html = document.documentElement;
    html.setAttribute('data-font-size', settings.accessibility.fontSize);
  }, [settings.accessibility.fontSize]);

  useEffect(() => {
    // Apply high contrast
    const html = document.documentElement;
    html.setAttribute('data-high-contrast', settings.accessibility.highContrast ? 'true' : 'false');
  }, [settings.accessibility.highContrast]);

  useEffect(() => {
    // Apply reduce animations
    const html = document.documentElement;
    html.setAttribute('data-reduce-animations', settings.accessibility.reduceAnimations ? 'true' : 'false');
  }, [settings.accessibility.reduceAnimations]);

  useEffect(() => {
    // Apply language
    document.documentElement.lang = settings.language;
    changeLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    // Broadcast preference updates so decoupled components/services can react instantly
    window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: settings }));
  }, [settings]);

  useEffect(() => {
    // Instantly apply TTS enable/disable across the app
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (!settings.accessibility.textToSpeech) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setTeachingSpeaking(false);
    }
  }, [settings.accessibility.textToSpeech, setTeachingSpeaking]);

  // Global audio unlock on first user interaction (required by iOS/Android)
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    document.addEventListener('touchend', handleFirstInteraction, { once: true, passive: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('touchend', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  return null;
}

// Hydration guard: ensures the authStore has fully rehydrated from localStorage before rendering routes
function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
    setIsHydrated(useAuthStore.persist.hasHydrated());
    return unsubFinishHydration;
  }, []);

  if (!isHydrated) {
    return <FullPageLoader message="" />;
  }

  return <>{children}</>;
}


// Default redirect: always show the login/landing page by default
function DefaultRedirect() {
  return <Navigate to="/login" replace />;
}

// Animated Routes Component — strict role separation: /student/*, /teacher/*, /admin/*
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Suspense fallback={<FullPageLoader message="Loading..." />}><LoginPage /></Suspense>} />

        {/* Student routes */}
        <Route path="/student" element={<Navigate to={studentRoutes.modeSelection} replace />} />
        <Route
          path="/student/mode-selection"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentModeSelectionPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/competitive"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentCompetitivePage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/onboarding"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <OnboardingPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/competitive-explain"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <CompetitiveTeachingPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/learn/:topicId?"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <TeachingPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <DashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/curriculum"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <CurriculumPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/settings"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <SettingsPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/student/profile"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <ProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />

        {/* Teacher routes */}
        <Route path="/teacher" element={<Navigate to={teacherRoutes.dashboard} replace />} />
        <Route
          path="/teacher/dashboard"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="teacher">
                  <TeacherDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/teacher/settings"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="teacher">
                  <SettingsPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="teacher">
                  <ProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />

        {/* Admin routes */}
        <Route path="/admin" element={<Navigate to={adminRoutes.dashboard} replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="admin">
                  <AdminDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="admin">
                  <SettingsPage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <ProtectedRoute>
                <RoleGuard allowedRole="admin">
                  <ProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            </Suspense>
          }
        />

        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { toasts, removeToast } = useToastStore();
  const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

  useEffect(() => {
    // Global TTS Engine Warm-up: Pre-initialize voices to avoid cold-start latency
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      // On some browsers, we need to listen for the voices changed event
      const warmup = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', warmup);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', warmup);
    }
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reduceAnimations ? 'always' : 'never'}>
        <BrowserRouter>
          <ScrollToTop />
          <SettingsEffect />
          <HydrationGuard>
            <AnimatedRoutes />
          </HydrationGuard>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
