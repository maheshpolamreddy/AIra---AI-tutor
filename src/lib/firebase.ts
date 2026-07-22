import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Prefer VITE_FIREBASE_* from .env / Vercel. Defaults below keep the app runnable if env is unset
// (restrict the web API key to your domains in Firebase Console).
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBcThGAGiomOjVEkiaCHb71iMuwPE9ZvZc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "project-aira-2d7f3.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "project-aira-2d7f3",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "project-aira-2d7f3.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "260240327920",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:260240327920:web:2f4a6109c56ed761bb2e35",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-G996JQV3PT",
};

const app = initializeApp(firebaseConfig);
// Only initialize Analytics in production. On http://localhost (vite preview) or strict embeds,
// getAnalytics can throw and would blank the whole app — never fail boot for analytics.
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

export { app, analytics, auth };
