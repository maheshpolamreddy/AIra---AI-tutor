/**
 * Voice for the "Raise a Doubt" chat teacher.
 * Independent of the lesson TTS pipeline (useSpeech) so a doubt answer can be
 * spoken while the lesson audio stays paused at its exact position.
 * Sarvam TTS first, browser speechSynthesis as fallback.
 */
import { aiService } from '../services/aiService';
import { forEachSarvamWavChunk } from './sarvamAudio';
import { pickBestHumanVoice } from './voice';

export interface DoubtSpeechOptions {
    /** BCP-47 style code used by Sarvam and the browser, e.g. 'en-IN', 'te-IN'. */
    language: string;
    /** Sarvam speaker name, e.g. 'anushka'. */
    speaker: string;
    /** Playback rate for the browser fallback (0.5–2). */
    speed: number;
    /** Preferred browser voice name (optional). */
    voiceName?: string;
}

let activeToken = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeAbort: AbortController | null = null;

/** Stop any doubt-teacher speech immediately (lesson audio is unaffected). */
export function stopDoubtSpeech(): void {
    activeToken++;
    try { activeAbort?.abort(); } catch { /* ignore */ }
    activeAbort = null;
    if (activeAudio) {
        try {
            activeAudio.pause();
            activeAudio.src = '';
        } catch { /* ignore */ }
        activeAudio = null;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

/** Make AI chat text sound natural when spoken: strip markdown and visual markers. */
export function toSpeakableText(text: string): string {
    return text
        .replace(/\[(?:VISUAL|TEXT)[^\]]*\]/gi, ' ')
        .replace(/```[\s\S]*?```/g, ' The code example is shown in the chat. ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/^[-*•]\s+/gm, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function speakWithBrowser(text: string, opts: DoubtSpeechOptions, isCurrent: () => boolean): Promise<void> {
    return new Promise<void>((resolve) => {
        const synth = window.speechSynthesis;
        if (!synth) {
            resolve();
            return;
        }
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = opts.language;
        utter.rate = Math.min(Math.max(opts.speed || 1, 0.5), 2);
        try {
            const voice = pickBestHumanVoice(synth.getVoices(), {
                language: opts.language,
                preferredName: opts.voiceName || '',
            });
            if (voice) utter.voice = voice;
        } catch { /* voice selection is best-effort */ }

        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            clearInterval(poll);
            resolve();
        };
        utter.onend = finish;
        utter.onerror = finish;
        // Poll so cancellation (stopDoubtSpeech → synth.cancel) always resolves the promise.
        const poll = setInterval(() => {
            if (!isCurrent() || !synth.speaking) finish();
        }, 250);
        try {
            synth.cancel();
            synth.speak(utter);
        } catch {
            finish();
        }
    });
}

/**
 * Speak a doubt-teacher reply. Any previous doubt speech is stopped first.
 * Resolves when playback finishes or is cancelled — never rejects.
 */
export async function speakDoubtText(text: string, opts: DoubtSpeechOptions): Promise<void> {
    stopDoubtSpeech();
    const token = activeToken;
    const isCurrent = () => token === activeToken;

    const speakable = toSpeakableText(text);
    if (!speakable) return;

    try {
        const dataUri = await aiService.fetchSarvamTTS(speakable, opts.language, opts.speaker);
        if (!isCurrent()) return;
        const abort = new AbortController();
        activeAbort = abort;
        await forEachSarvamWavChunk(dataUri, (blob) => new Promise<void>((resolve, reject) => {
            if (!isCurrent()) {
                resolve();
                return;
            }
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.setAttribute('playsinline', 'true');
            activeAudio = audio;
            const done = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onended = done;
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Doubt speech playback failed'));
            };
            audio.play().catch((err) => {
                URL.revokeObjectURL(url);
                reject(err instanceof Error ? err : new Error('Doubt speech autoplay blocked'));
            });
        }), { signal: abort.signal });
    } catch {
        if (!isCurrent()) return;
        await speakWithBrowser(speakable, opts, isCurrent);
    } finally {
        if (isCurrent()) {
            activeAudio = null;
            activeAbort = null;
        }
    }
}
