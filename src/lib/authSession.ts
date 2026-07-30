import { doc, getDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';
import type { AppRole, User } from '../types';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';

export function normalizeAppRole(role: unknown): AppRole {
    if (role === 'teacher' || role === 'admin') return role;
    return 'student';
}

export function homeForRole(role: AppRole | null): string {
    if (role === 'teacher') return teacherRoutes.dashboard;
    if (role === 'admin') return adminRoutes.dashboard;
    return studentRoutes.modeSelection;
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

/**
 * Landing login URL.
 * - Same-origin (landing host + rewrites): relative `/login?...`
 * - Tutor standalone (:5173 or ai-ra-app.vercel.app): absolute landing origin
 */
export function getLandingLoginUrl(returnPath: string): string {
    const configured = (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? '';
    const redirect = encodeURIComponent(returnPath || '/student/mode-selection');
    const path = `/login?redirect=${redirect}`;

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

export function redirectToLandingLogin(returnPath: string): void {
    window.location.assign(getLandingLoginUrl(returnPath));
}
