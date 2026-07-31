import { doc, getDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';
import type { AppRole, User } from '../types';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';
import { readStudentHomeHint } from './sessionHints';

export function normalizeAppRole(role: unknown): AppRole {
    if (role === 'teacher' || role === 'admin') return role;
    return 'student';
}

/**
 * Students who already picked a mode go straight back to it instead of
 * repeating the mode picker on every sign-in.
 */
export function homeForRole(role: AppRole | null): string {
    if (role === 'teacher') return teacherRoutes.dashboard;
    if (role === 'admin') return adminRoutes.dashboard;
    return readStudentHomeHint() ?? studentRoutes.modeSelection;
}

export async function fetchUserAppRole(uid: string): Promise<AppRole> {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        return normalizeAppRole(snap.data()?.role);
    } catch (err) {
        if (import.meta.env.DEV) console.warn('[auth] fetchUserAppRole failed', err);
        return 'student';
    }
}

export function mapFirebaseUser(fb: FirebaseUser): User {
    const fallback = fb.email?.split('@')[0] || 'User';
    const providerId = fb.providerData[0]?.providerId ?? '';
    let authMethod: User['authMethod'] = 'email';
    if (providerId.includes('google')) authMethod = 'google';
    else if (providerId.includes('apple')) authMethod = 'apple';

    return {
        id: fb.uid,
        email: fb.email || '',
        name: fb.displayName || fallback,
        displayName: fb.displayName || fallback,
        avatar: fb.photoURL || undefined,
        authMethod,
        isVerified: fb.emailVerified,
        createdAt: fb.metadata.creationTime || new Date().toISOString(),
    };
}

const PROD_LANDING = 'https://aira-landing-page-elite.vercel.app';

export interface LandingLoginOptions {
    /**
     * Marks the navigation as following an explicit sign-out. The landing login
     * page uses this to clear its own Firebase session and to stay on the form
     * instead of auto-continuing back into the app — which matters because the
     * tutor can run on a different origin, where its sign-out cannot reach the
     * session the landing app persisted.
     */
    signedOut?: boolean;
}

/**
 * Landing login URL.
 * - Same-origin (landing host + rewrites): relative `/login?...`
 * - Tutor standalone (:5173 or ai-ra-app.vercel.app): absolute landing origin
 */
export function getLandingLoginUrl(returnPath: string, options: LandingLoginOptions = {}): string {
    const configured = (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? '';
    const redirect = encodeURIComponent(returnPath || homeForRole('student'));
    const path = `/login?redirect=${redirect}${options.signedOut ? '&signedOut=1' : ''}`;

    if (configured) return `${configured}${path}`;

    if (typeof window !== 'undefined') {
        const { hostname, port } = window.location;
        const tutorStandalone =
            hostname.includes('ai-ra-app') ||
            port === '5173' ||
            port === '4173';
        if (tutorStandalone) {
            const fallback =
                hostname === 'localhost' || hostname === '127.0.0.1'
                    ? 'http://localhost:3000'
                    : PROD_LANDING;
            return `${fallback}${path}`;
        }
    }

    // Landing host (rewrites): stay relative so Firebase auth stays same-origin
    return path;
}

export function redirectToLandingLogin(
    returnPath: string,
    options: LandingLoginOptions = {},
): void {
    window.location.assign(getLandingLoginUrl(returnPath, options));
}

/** Use after `authStore.logout()` so the user lands on the sign-in form. */
export function redirectAfterSignOut(returnPath: string): void {
    redirectToLandingLogin(returnPath, { signedOut: true });
}
