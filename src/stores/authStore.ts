import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, AppRole } from '../types';
import { auth } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
} from 'firebase/auth';
import { useCurriculumStore } from './curriculumStore';
import {
    fetchUserAppRole,
    mapFirebaseUser,
    normalizeAppRole,
} from '../lib/authSession';
import { clearRoleHint, readRoleHint, writeRoleHint } from '../lib/sessionHints';

/** Map Firebase Auth errors for readable signup/login toasts */
function firebaseAuthMessage(error: unknown): string | null {
    const code =
        typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
            ? (error as { code: string }).code
            : '';
    const byCode: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters with a mix of letters and numbers if possible.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
        'auth/operation-not-allowed': 'Email/password sign-up is disabled in the project settings.',
        'auth/user-not-found': 'No account found for this email.',
        'auth/wrong-password': 'Incorrect password. Try again or reset your password.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/user-disabled': 'This account has been disabled.',
    };
    return byCode[code] ?? null;
}

function normalizeEmailAppRole(role?: AppRole): AppRole {
    return normalizeAppRole(role);
}

interface AuthStore extends AuthState {
    /** True after first Firebase onAuthStateChanged callback. */
    authReady: boolean;
    login: (user: User) => void;
    setRole: (role: AppRole) => void;
    /** Rename the signed-in learner; writes through to Firebase so it survives a reload. */
    updateDisplayName: (name: string) => Promise<void>;
    /** Bridge landing Firebase session into the tutor store. */
    applyFirebaseUser: (fbUser: FirebaseUser | null) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    loginWithEmail: (email: string, password: string, appRole?: AppRole) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string, appRole?: AppRole) => Promise<void>;
    loginWithRollNumber: (rollNumber: string, dob: string) => Promise<void>;
    signUpWithRollNumber: (rollNumber: string, dob: string, name: string) => Promise<void>;
    continueAsGuest: () => void;
    skipToDemo: () => void;
    enterStudentDemo: () => void;
    enterTeacherDemo: () => void;
    enterAdminDemo: () => void;
    logout: () => Promise<void>;
    recoverPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const createGuestUser = (): User => ({
    id: 'guest_' + Date.now(),
    email: 'guest@aitutor.demo',
    name: 'Guest User',
    displayName: 'Guest',
    authMethod: 'guest',
    isVerified: false,
    createdAt: new Date().toISOString(),
});

const createDemoUser = (roleLabel: string): User => ({
    id: `demo_${roleLabel}_${Date.now()}`,
    email: `demo-${roleLabel}@aitutor.app`,
    name: `${roleLabel} Demo User`,
    displayName: `${roleLabel} Demo`,
    authMethod: 'email',
    isVerified: true,
    createdAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isGuest: false,
            role: null,
            isDemo: false,
            authReady: false,

            login: (user) => set({
                user,
                isAuthenticated: true,
                isGuest: user.authMethod === 'guest',
                role: 'student',
                isDemo: false,
            }),

            setRole: (role) => set({ role }),

            updateDisplayName: async (name) => {
                const trimmed = name.trim();
                const current = get().user;
                if (!trimmed || !current) return;
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: trimmed });
                }
                set({ user: { ...current, name: trimmed, displayName: trimmed } });
            },

            applyFirebaseUser: async (fbUser) => {
                if (!fbUser) {
                    // Keep explicit local demo sessions; clear everything else.
                    if (get().isDemo) {
                        // Demo sessions persist user/role/isDemo but not isAuthenticated;
                        // restore the gate so a refresh stays signed in as the demo persona.
                        set({
                            authReady: true,
                            isAuthenticated: Boolean(get().user),
                            isGuest: false,
                        });
                        return;
                    }
                    set({
                        user: null,
                        isAuthenticated: false,
                        isGuest: false,
                        role: null,
                        isDemo: false,
                        isLoading: false,
                        authReady: true,
                    });
                    return;
                }

                const user = mapFirebaseUser(fbUser);
                // Unblock UI immediately with an optimistic role, then refine from
                // Firestore. The hint written by the landing app at sign-in is what
                // avoids a student-shaped first paint for teachers and admins.
                const cachedRole = normalizeAppRole(get().role ?? readRoleHint() ?? 'student');
                set({
                    user,
                    isAuthenticated: true,
                    isGuest: false,
                    role: cachedRole,
                    isDemo: false,
                    isLoading: false,
                    authReady: true,
                });

                try {
                    const role = await fetchUserAppRole(fbUser.uid);
                    if (get().user?.id === fbUser.uid) {
                        set({ role });
                        writeRoleHint(role);
                    }
                } catch {
                    // keep optimistic role
                }
            },

            loginWithGoogle: async () => {
                set({ isLoading: true });
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const user: User = {
                        id: 'google_' + Date.now(),
                        email: 'user@gmail.com',
                        name: 'Google User',
                        displayName: 'Google User',
                        avatar: 'https://ui-avatars.com/api/?name=Google+User&background=random',
                        authMethod: 'google',
                        isVerified: true,
                        createdAt: new Date().toISOString(),
                    };
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role: 'student', isDemo: false });
                } catch (error) {
                    console.error('Google login failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            loginWithApple: async () => {
                set({ isLoading: true });
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const user: User = {
                        id: 'apple_' + Date.now(),
                        email: 'user@icloud.com',
                        name: 'Apple User',
                        displayName: 'Apple User',
                        authMethod: 'apple',
                        isVerified: true,
                        createdAt: new Date().toISOString(),
                    };
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role: 'student', isDemo: false });
                } catch (error) {
                    console.error('Apple login failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            loginWithEmail: async (email, password, appRole) => {
                set({ isLoading: true });
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const role = appRole
                        ? normalizeEmailAppRole(appRole)
                        : await fetchUserAppRole(userCredential.user.uid);
                    const user = mapFirebaseUser(userCredential.user);
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role, isDemo: false });
                } catch (error) {
                    console.error('Email login failed:', error);
                    set({ isLoading: false });
                    const mapped = firebaseAuthMessage(error);
                    throw new Error(mapped ?? 'Sign in failed. Please check your email and password.');
                }
            },

            signUpWithEmail: async (email, password, name, appRole) => {
                set({ isLoading: true });
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(userCredential.user, { displayName: name });
                    const user = mapFirebaseUser(userCredential.user);
                    user.name = name;
                    user.displayName = name;
                    const app = normalizeEmailAppRole(appRole);
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role: app, isDemo: false });
                } catch (error) {
                    console.error('Email signup failed:', error);
                    set({ isLoading: false });
                    const mapped = firebaseAuthMessage(error);
                    throw new Error(mapped ?? 'Could not create your account. Please try again.');
                }
            },

            // Kept for possible school roll-number flow; not exposed in UI until migrated to landing.
            loginWithRollNumber: async (rollNumber, dob) => {
                set({ isLoading: true });
                try {
                    const internalEmail = `student_${rollNumber.toLowerCase()}_${dob.replace(/-/g, '')}@aitutor.internal`;
                    const internalPassword = `auth_${rollNumber}_${dob}`;
                    const userCredential = await signInWithEmailAndPassword(auth, internalEmail, internalPassword);
                    const user: User = {
                        id: userCredential.user.uid,
                        email: rollNumber,
                        name: userCredential.user.displayName || `Student ${rollNumber}`,
                        displayName: userCredential.user.displayName || rollNumber,
                        authMethod: 'email',
                        isVerified: true,
                        createdAt: new Date().toISOString(),
                    };
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role: 'student', isDemo: false });
                } catch (error) {
                    console.error('Roll number login failed:', error);
                    set({ isLoading: false });
                    const mapped = firebaseAuthMessage(error);
                    throw new Error(mapped ?? 'Invalid Roll Number or Date of Birth');
                }
            },

            signUpWithRollNumber: async (rollNumber, dob, name) => {
                set({ isLoading: true });
                try {
                    const internalEmail = `student_${rollNumber.toLowerCase()}_${dob.replace(/-/g, '')}@aitutor.internal`;
                    const internalPassword = `auth_${rollNumber}_${dob}`;
                    const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, internalPassword);
                    await updateProfile(userCredential.user, { displayName: name });
                    const user: User = {
                        id: userCredential.user.uid,
                        email: rollNumber,
                        name,
                        displayName: name,
                        authMethod: 'email',
                        isVerified: false,
                        createdAt: new Date().toISOString(),
                    };
                    set({ user, isAuthenticated: true, isLoading: false, isGuest: false, role: 'student', isDemo: false });
                } catch (error) {
                    console.error('Roll number signup failed:', error);
                    set({ isLoading: false });
                    const mapped = firebaseAuthMessage(error);
                    const code =
                        typeof error === 'object' && error !== null && 'code' in error
                            ? (error as { code: string }).code
                            : '';
                    if (code === 'auth/email-already-in-use') {
                        throw new Error('This Roll Number is already registered.');
                    }
                    throw new Error(mapped ?? 'Registration failed. Please try again.');
                }
            },

            continueAsGuest: () => {
                const user = createGuestUser();
                set({ user, isAuthenticated: true, isGuest: true, role: 'student', isDemo: false });
            },

            skipToDemo: () => {
                const user = createDemoUser('Student');
                set({ user, isAuthenticated: true, isGuest: false, role: 'student', isDemo: true });
            },

            enterStudentDemo: () => {
                const user = createDemoUser('Student');
                set({ user, isAuthenticated: true, isGuest: false, role: 'student', isDemo: true });
            },

            enterTeacherDemo: () => {
                const user = createDemoUser('Teacher');
                set({ user, isAuthenticated: true, isGuest: false, role: 'teacher', isDemo: true });
            },

            enterAdminDemo: () => {
                const user = createDemoUser('Admin');
                set({ user, isAuthenticated: true, isGuest: false, role: 'admin', isDemo: true });
            },

            logout: async () => {
                try {
                    await firebaseSignOut(auth);
                } catch (err) {
                    if (import.meta.env.DEV) console.warn('[authStore] Firebase signOut error (ignored):', err);
                }
                useCurriculumStore.getState().clearSelection();
                clearRoleHint();
                set({
                    user: null,
                    isAuthenticated: false,
                    isGuest: false,
                    role: null,
                    isDemo: false,
                });
            },

            recoverPassword: async (_email) => {
                void _email;
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error('Password recovery failed:', error);
                    throw error;
                }
            },

            resetPassword: async (_token, _newPassword) => {
                void _token;
                void _newPassword;
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error('Password reset failed:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'ai-tutor-auth',
            // v4: Firebase session is source of truth; drop stale demo persistence as auth gate
            version: 4,
            partialize: (state) => ({
                // Do not persist isAuthenticated — Firebase onAuthStateChanged rehydrates it.
                role: state.role,
                isDemo: state.isDemo,
                user: state.isDemo ? state.user : null,
            }),
            migrate: () => ({
                user: null,
                isAuthenticated: false,
                isGuest: false,
                role: null,
                isDemo: false,
            }),
        }
    )
);
