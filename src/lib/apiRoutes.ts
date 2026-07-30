/**
 * Canonical same-origin API paths shared by landing + tutor.
 * Always use relative URLs so they hit:
 * - Landing Next.js handlers when the browser origin is the landing host
 * - Vite → landing proxy when the browser origin is the tutor Vite host
 * - Tutor Vercel serverless when the browser origin is ai-ra-app.vercel.app
 */
export const API_ROUTES = {
  tts: '/api/tts',
  ttsHealth: '/api/tts/health',
  chat: '/api/chat',
  waitlist: '/api/waitlist',
} as const;
