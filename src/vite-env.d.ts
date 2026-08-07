/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
    readonly VITE_OPENROUTER_API_KEY?: string;
    readonly VITE_MISTRAL_API_KEY?: string;
    readonly VITE_DEEPSEEK_API_KEY?: string;
    readonly VITE_SARVAM_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.css' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.svg?url' {
    const src: string;
    export default src;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module 'jspdf';
declare module 'html2canvas';

/** Vite resolves `?url` to a string asset URL */
declare module 'pdfjs-dist/build/pdf.worker.mjs?url' {
    const src: string;
    export default src;
}

declare module 'mammoth';
