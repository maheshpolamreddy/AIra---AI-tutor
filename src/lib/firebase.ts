import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Shared Firebase project with the AIra landing page (aira-landingpage).
 * Prefer VITE_FIREBASE_* from env / Vercel; defaults match landing NEXT_PUBLIC_* config.
 * Retires the old project-aira-2d7f3 defaults.
 */
const firebaseConfig = {
    apiKey:
        import.meta.env.VITE_FIREBASE_API_KEY ??
        'AIzaSyC9L2gJBJI_C0kCy2zVxMfiZqIGEjd-w1o',
    authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
        'aira-landingpage.firebaseapp.com',
    projectId:
        import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'aira-landingpage',
    storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
        'aira-landingpage.firebasestorage.app',
    messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '993289285952',
    appId:
        import.meta.env.VITE_FIREBASE_APP_ID ??
        '1:993289285952:web:5c5751a02c1fc3c173caa5',
    measurementId:
        import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-9FT49STZ0P',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (import.meta.env.PROD) {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        if (import.meta.env.DEV) console.warn('[firebase] Analytics disabled:', e);
        else console.warn('[firebase] Analytics init skipped');
    }
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db, firebaseConfig };
