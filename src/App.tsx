import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { useTeachingStore } from './stores/teachingStore';
import { changeLanguage } from './i18n';
import ErrorBoundary from './components/common/ErrorBoundary';
import FullPageLoader from './components/common/FullPageLoader';
import ToastContainer from './components/common/Toast';
import { useToastStore } from './stores/toastStore';
import { getRoleFromPath, teacherRoutes, adminRoutes } from './utils/routes';
import type { AppRole } from './types';
import ScrollToTop from './components/common/ScrollToTop';
import { unlockAudioContext } from './hooks/useSpeech';
import { auth } from './lib/firebase';
import { homeForRole, redirectToLandingLogin } from './lib/authSession';

const DemoRolesPage = lazy(() => import('./pages/DemoRolesPage'));
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

/** Sync Firebase Auth (shared with landing) into the tutor Zustand store. */
function FirebaseAuthBridge() {
  const applyFirebaseUser = useAuthStore((s) => s.applyFirebaseUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      void applyFirebaseUser(fbUser);
    });
    return unsub;
  }, [applyFirebaseUser]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authReady = useAuthStore((state) => state.authReady);
  const role = useAuthStore((state) => state.role);
  const setRole = useAuthStore((state) => state.setRole);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !role) {
      setRole('student');
    }
  }, [isAuthenticated, role, setRole]);

  useEffect(() => {
    if (!authReady || isAuthenticated) return;
    const returnPath = `${location.pathname}${location.search}`;
    redirectToLandingLogin(returnPath);
  }, [authReady, isAuthenticated, location.pathname, location.search]);

  if (!authReady) {
    return <FullPageLoader message="" />;
  }

  if (!isAuthenticated) {
    return <FullPageLoader message="Redirecting to sign in…" />;
  }

  if (!role) {
    return <FullPageLoader message="" />;
  }

  return <>{children}</>;
}

function RoleGuard({ allowedRole, children }: { allowedRole: AppRole; children: React.ReactNode }) {
  const role = useAuthStore((state) => state.role);
  const location = useLocation();
  const pathRole = getRoleFromPath(location.pathname);

  if (role !== allowedRole || pathRole !== allowedRole) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <>{children}</>;
}

/** Demo role switcher — only in DEV or for authenticated admins. */
function DemoRolesGate({ children }: { children: React.ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  useEffect(() => {
    if (!authReady) return;
    const allowed = import.meta.env.DEV || (isAuthenticated && role === 'admin');
    if (!allowed) {
      redirectToLandingLogin(`${location.pathname}${location.search}`);
    }
  }, [authReady, isAuthenticated, role, location.pathname, location.search]);

  if (!authReady) return <FullPageLoader message="" />;
  const allowed = import.meta.env.DEV || (isAuthenticated && role === 'admin');
  if (!allowed) return <FullPageLoader message="Redirecting…" />;
  return <>{children}</>;
}

function SettingsEffect() {
  const settings = useSettingsStore((state) => state.settings);
  const setTeachingSpeaking = useTeachingStore((state) => state.setSpeaking);

  useEffect(() => {
    const html = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    if (settings.theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      themeColorMeta?.setAttribute('content', '#020617');
    } else if (settings.theme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      themeColorMeta?.setAttribute('content', '#a855f7');
    } else {
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
    document.documentElement.setAttribute('data-font-size', settings.accessibility.fontSize);
  }, [settings.accessibility.fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-high-contrast',
      settings.accessibility.highContrast ? 'true' : 'false',
    );
  }, [settings.accessibility.highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduce-animations',
      settings.accessibility.reduceAnimations ? 'true' : 'false',
    );
  }, [settings.accessibility.reduceAnimations]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    changeLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: settings }));
  }, [settings]);

  useEffect(() => {
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

function RootRedirect() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      redirectToLandingLogin(homeForRole(role));
    }
  }, [authReady, isAuthenticated, role]);

  if (!authReady) return <FullPageLoader message="" />;
  if (!isAuthenticated) return <FullPageLoader message="Redirecting to sign in…" />;
  return <Navigate to={homeForRole(role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<RootRedirect />} />
        {/* Legacy: send old /login bookmarks to the landing login */}
        <Route
          path="/login"
          element={<LoginRedirect />}
        />

        <Route
          path="/dev/demo-roles"
          element={
            <Suspense fallback={<FullPageLoader message="Loading..." />}>
              <DemoRolesGate>
                <DemoRolesPage />
              </DemoRolesGate>
            </Suspense>
          }
        />

        {/* Student routes */}
        <Route path="/student" element={<Navigate to={homeForRole('student')} replace />} />
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

        <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function LoginRedirect() {
  useEffect(() => {
    // Read once on mount: hydration has already settled by the time this renders.
    redirectToLandingLogin(homeForRole(useAuthStore.getState().role));
  }, []);
  return <FullPageLoader message="Redirecting to sign in…" />;
}

function App() {
  const { toasts, removeToast } = useToastStore();
  const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
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
            <FirebaseAuthBridge />
            <AppRoutes />
          </HydrationGuard>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
