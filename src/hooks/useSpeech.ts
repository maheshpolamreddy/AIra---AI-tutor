import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '../stores/teachingStore';
import { useSettingsStore, DEFAULT_TTS_LANGUAGE } from '../stores/settingsStore';
import { isVoiceCompatibleWithLanguage, pickBestHumanVoice } from '../utils/voice';
import { emitVisualMarker } from '../utils/visualSyncEngine';
import { stripMarkers } from '../utils/markerParser';
import { aiService } from '../services/aiService';
import { forEachSarvamWavChunk } from '../utils/sarvamAudio';

let _cachedVoice: SpeechSynthesisVoice | null = null;
let _cachedLang: string | null = null;
let _cachedName: string | null = null;
const TTS_TARGET_CHARS_PER_CHUNK = 500;
const TTS_MAX_RETRIES = 2;

const MOBILE_SPEECH_CHUNK_LIMIT = 180;

let _lastFallbackToast = 0;

// TTS Circuit Breaker state
let _isBackendTtsDown = false;
let _backendTtsFailureCount = 0;
let _lastBackendTtsAttemptTime = 0;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60000; // 1 minute

export function clearVoiceCache() {
    _cachedVoice = null;
    _cachedLang = null;
    _cachedName = null;
}

function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
}

function isIOSSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isNonEnglishLang(lang: string): boolean {
    const base = (lang || '').split('-')[0].toLowerCase();
    return !!base && base !== 'en';
}

function getCachedVoice(lang: string, preferredName?: string): SpeechSynthesisVoice | null {
    const pName = preferredName || '';
    if (_cachedLang === lang && _cachedName === pName && _cachedVoice) {
        if (isVoiceCompatibleWithLanguage(_cachedVoice, lang)) {
            return _cachedVoice;
        }
        _cachedVoice = null;
    }
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (voices.length === 0) return null;
    _cachedVoice = pickBestHumanVoice(voices, { language: lang, preferredName: pName }) ?? null;
    _cachedLang = lang;
    _cachedName = pName;
    return _cachedVoice;
}

let _audioUnlocked = false;
let _audioContext: AudioContext | null = null;

export function unlockAudioContext() {
    if (_audioUnlocked) return;
    try {
        if (!_audioContext) {
            const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AC) _audioContext = new AC();
        }
        if (_audioContext?.state === 'suspended') {
            _audioContext.resume().catch(() => {});
        }

        const a = new Audio();
        a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        a.volume = 0.01;
        a.setAttribute('playsinline', 'true');
        const playPromise = a.play();
        if (playPromise) playPromise.catch(() => {});

        if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis.speak(u);
            setTimeout(() => window.speechSynthesis.cancel(), 10);
        }
        _audioUnlocked = true;
    } catch {
        /* audio unlock may fail in restricted browser contexts */
    }
}

function showFallbackToast(message: string) {
    const now = Date.now();
    if (now - _lastFallbackToast < 30000) return;
    _lastFallbackToast = now;
    try {
        window.dispatchEvent(new CustomEvent('tts-fallback-notice', { detail: { message } }));
    } catch {
        /* dispatch may fail if document is unavailable */
    }
}

function splitTextForMobile(text: string): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let cur = '';
    for (const s of sentences) {
        const trimmed = s.trim();
        if (!trimmed) continue;
        if ((cur + ' ' + trimmed).trim().length > MOBILE_SPEECH_CHUNK_LIMIT) {
            if (cur) chunks.push(cur.trim());
            cur = trimmed;
        } else {
            cur = (cur ? cur + ' ' : '') + trimmed;
        }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length > 0 ? chunks : [text];
}

interface PrefetchItem {
    promise?: Promise<void>;
    blob?: Blob;
    dataUri?: string;
    type: 'loading' | 'api' | 'sarvam' | 'browser' | 'error';
}

export function useSpeech(
    currentStepData: { id?: string; spokenContent?: string; visualDomain?: string } | null | undefined,
    playbackTrigger: number
) {
    const { isPaused, setSpeaking } = useTeachingStore(useShallow(s => ({ isPaused: s.isPaused, setSpeaking: s.setSpeaking })));
    const { settings } = useSettingsStore(useShallow(s => ({ settings: s.settings })));
    const prefetchCache = useRef<Record<string, PrefetchItem>>({});

    const [isMuted, setIsMuted] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isFetchingAudio, setIsFetchingAudio] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);
    const settingsVersionRef = useRef(0);
    const iosKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
    /** Monotonic id so async TTS pipelines from a previous effect run exit immediately (fixes double speech under Strict Mode / rapid deps). */
    const speechPlaybackGenRef = useRef(0);
    /** Set when user triggers Stop listening — aborts pipeline; cleared when run() exits after handling. */
    const userStoppedPlaybackRef = useRef(false);
    /** Synced before paint so async TTS loops see pause immediately (avoids one-frame race). */
    const isPausedRef = useRef(isPaused);
    useLayoutEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    // Tracking for resuming playback
    const activeSegIndexRef = useRef(0);
    const activeChunkIndexRef = useRef(0);
    const lastStepIdRef = useRef<string | null>(null);
    const lastPlaybackTriggerRef = useRef(playbackTrigger);
    const manualTriggerRef = useRef(false);

    // Reset position when the step changes OR when Start Listening is pressed again (trigger bump)
    if (currentStepData?.id !== lastStepIdRef.current || playbackTrigger !== lastPlaybackTriggerRef.current) {
        const wasTriggerBump = playbackTrigger !== lastPlaybackTriggerRef.current && playbackTrigger > 0;
        lastStepIdRef.current = currentStepData?.id || null;
        lastPlaybackTriggerRef.current = playbackTrigger;
        activeSegIndexRef.current = 0;
        activeChunkIndexRef.current = 0;
        if (wasTriggerBump) manualTriggerRef.current = true;
    }

    const sleep = useCallback((ms: number) => new Promise<void>(r => setTimeout(r, ms)), []);

    /** Pause/resume HTML audio and browser speech without tearing down the playback pipeline (resume continues same step). */
    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        if (isPaused) {
            try {
                audioRef.current?.pause();
            } catch { /* ignore */ }
            try {
                window.speechSynthesis?.pause();
            } catch { /* ignore */ }
        } else {
            try {
                void audioRef.current?.play();
            } catch { /* ignore */ }
            try {
                window.speechSynthesis?.resume();
            } catch { /* ignore */ }
        }
    }, [isPaused]);

    /** Hard stop from TeachingPage (Stop listening): abort fetch, cancel speech, clear audio immediately. */
    useEffect(() => {
        const onStopSpeech = () => {
            userStoppedPlaybackRef.current = true;
            speechPlaybackGenRef.current++;
            try {
                abortRef.current?.abort();
            } catch { /* ignore */ }
            try {
                window.speechSynthesis?.cancel();
            } catch { /* ignore */ }
            if (iosKeepAliveRef.current) {
                clearInterval(iosKeepAliveRef.current);
                iosKeepAliveRef.current = null;
            }
            try {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                    audioRef.current = null;
                }
            } catch { /* ignore */ }
            if (isMountedRef.current) {
                setSpeaking(false);
                setIsFetchingAudio(false);
            }
        };
        window.addEventListener('stop-speech', onStopSpeech);
        return () => window.removeEventListener('stop-speech', onStopSpeech);
    }, [setSpeaking]);

    const ttsLang = settings.accessibility?.ttsLanguage || DEFAULT_TTS_LANGUAGE;
    const ttsSpeaker = settings.accessibility?.ttsSpeaker || 'anushka';
    const ttsVoice = settings.accessibility?.ttsVoice || '';
    const ttsSpeed = settings.accessibility?.ttsSpeed ?? 1;
    const ttsEnabled = settings.accessibility?.textToSpeech ?? false;

    const mobile = useRef(isMobileDevice()).current;
    const ios = useRef(isIOSSafari()).current;

    useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

    useEffect(() => {
        if (!window.speechSynthesis) return;
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) clearVoiceCache();
        };
        loadVoices();
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        let poll: ReturnType<typeof setInterval> | null = null;
        if (mobile) {
            poll = setInterval(() => {
                const v = window.speechSynthesis.getVoices();
                if (v.length > 0) {
                    clearVoiceCache();
                    if (poll) {
                        clearInterval(poll);
                        poll = null;
                    }
                }
            }, 250);
        }
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            if (poll) clearInterval(poll);
        };
    }, [mobile]);

    useEffect(() => {
        clearVoiceCache();
        settingsVersionRef.current++;
    }, [ttsLang, ttsVoice, ttsSpeaker]);

    const normText = useCallback((raw: string) =>
        raw.replace(/#{1,6}\s?/g, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
           .replace(/__(.+?)__/g, '$1').replace(/_(.+?)_/g, '$1').replace(/`(.+?)`/g, '$1')
           .replace(/^[-*+]\s+/gm, '').replace(/\s+/g, ' ').trim(), []);

    const splitChunks = useCallback((text: string): string[] => {
        const parts = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
        const chunks: string[] = [];
        let cur = '';
        for (const p of parts) {
            const s = p.trim();
            if (!s) continue;
            if ((cur + ' ' + s).trim().length <= TTS_TARGET_CHARS_PER_CHUNK) { cur = (cur ? cur + ' ' : '') + s; continue; }
            if (cur) chunks.push(cur.trim());
            cur = s;
        }
        if (cur.trim()) chunks.push(cur.trim());
        return chunks.length > 0 ? chunks : [text];
    }, []);

    const playAudioBlob = useCallback(async (blob: Blob, chunkText?: string, marker?: string | null, playbackRunId?: number) => {
        if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
        const url = URL.createObjectURL(blob);
        if (_audioContext?.state === 'suspended') {
            await _audioContext.resume().catch(() => {});
        }
        if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
        
        await new Promise<void>((resolve) => {
            if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) {
                URL.revokeObjectURL(url);
                resolve();
                return;
            }
            
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.setAttribute('playsinline', 'true');
            // @ts-expect-error webkit prefix for older iOS
            audio.webkitPlaysInline = true;
            audioRef.current = audio;

            const done = () => {
                audio.onplay = null; audio.onended = null; audio.onerror = null;
                audio.onpause = null; audio.onstalled = null;
                audioRef.current = null;
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onplay = () => {
                if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
                if (isMountedRef.current) setSpeaking(true);
                if (marker) emitVisualMarker(marker);
                if (chunkText) window.dispatchEvent(new CustomEvent('speech-active-chunk', { detail: { chunkText } }));
            };
            audio.onended = done;
            audio.onerror = done;
            let stallTimer: ReturnType<typeof setTimeout> | null = null;
            audio.onstalled = () => { stallTimer = setTimeout(done, 5000); };
            audio.onplaying = () => { if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; } };

            const playPromise = audio.play();
            if (playPromise) {
                playPromise.catch((err) => {
                    console.warn('[useSpeech] Audio play rejected:', err.message);
                    done();
                });
            }
        });
    }, [setSpeaking]);

    const playBrowserChunk = useCallback(async (text: string, lang: string, marker?: string | null, prefVoice?: string, speed?: number, playbackRunId?: number) => {
        if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
        let effectiveLang = lang;
        let voice = getCachedVoice(lang, prefVoice || '');

        // When user selected non-English but no compatible browser voice exists,
        // fall back to English so speech continues (user prefers continuity over silence)
        if (isNonEnglishLang(lang)) {
            if (!voice || !isVoiceCompatibleWithLanguage(voice, lang)) {
                showFallbackToast(`No ${lang} browser voice on this device. Continuing in English for uninterrupted speech.`);
                effectiveLang = DEFAULT_TTS_LANGUAGE;
                voice = getCachedVoice(DEFAULT_TTS_LANGUAGE, '');
            }
        }

        const shouldChunkForMobile = ios || mobile;
        const textChunks = shouldChunkForMobile ? splitTextForMobile(text) : [text];
        // Only cancel before first chunk to clear stale state; never between our own sequential chunks
        if (ios && textChunks.length > 0) window.speechSynthesis.cancel();

        for (let idx = 0; idx < textChunks.length; idx++) {
            if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
            while (isPausedRef.current && !userStoppedPlaybackRef.current) {
                await sleep(80);
            }
            if (userStoppedPlaybackRef.current) return;
            if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
            const chunk = textChunks[idx];
            await new Promise<void>((resolve) => {
                if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) { resolve(); return; }
                const synth = window.speechSynthesis;

                const utter = new SpeechSynthesisUtterance(chunk);
                utter.rate = speed ?? 1;
                utter.lang = effectiveLang;
                if (voice) {
                    utter.voice = voice;
                }
                utter.onstart = () => {
                    if (playbackRunId !== undefined && speechPlaybackGenRef.current !== playbackRunId) return;
                    if (isMountedRef.current) setSpeaking(true);
                    if (marker && chunk === textChunks[0]) emitVisualMarker(marker);
                    window.dispatchEvent(new CustomEvent('speech-active-chunk', { detail: { chunkText: chunk } }));
                };
                utter.onend = () => resolve();
                utter.onerror = (e) => {
                    if (e.error === 'interrupted' || e.error === 'canceled') { resolve(); return; }
                    console.warn('[useSpeech] SpeechSynthesis error:', e.error);
                    resolve();
                };

                synth.speak(utter);

                if (ios) {
                    const keepAlive = setInterval(() => {
                        if (!synth.speaking) { clearInterval(keepAlive); return; }
                        synth.pause();
                        synth.resume();
                    }, 10000);
                    iosKeepAliveRef.current = keepAlive;
                    const origOnEnd = utter.onend;
                    const origOnError = utter.onerror;
                    utter.onend = (ev) => { clearInterval(keepAlive); iosKeepAliveRef.current = null; if (origOnEnd) (origOnEnd as (ev: SpeechSynthesisEvent) => void)(ev); };
                    utter.onerror = (ev) => { clearInterval(keepAlive); iosKeepAliveRef.current = null; if (origOnError) (origOnError as (ev: SpeechSynthesisErrorEvent) => void)(ev); };
                }

                if (mobile && !ios) {
                    const estimatedMs = (chunk.length / 5) * (1000 / (speed ?? 1)) + 3000;
                    const safetyTimeout = setTimeout(() => {
                        if (synth.speaking) synth.cancel();
                        resolve();
                    }, Math.min(estimatedMs, 30000));
                    const origOnEnd2 = utter.onend;
                    utter.onend = (ev) => { clearTimeout(safetyTimeout); if (origOnEnd2) (origOnEnd2 as (ev: SpeechSynthesisEvent) => void)(ev); };
                }
            });
        }
    }, [setSpeaking, ios, mobile, sleep]);

    const prefetchChunk = useCallback(async (
        chunkText: string,
        targetLang: string,
        eSpeaker: string,
        eSpeed: number,
        ac: AbortController,
        playbackRunId: number
    ) => {
        if (!chunkText || prefetchCache.current[chunkText]) return;
        if (speechPlaybackGenRef.current !== playbackRunId) return;

        const langForApi = targetLang || DEFAULT_TTS_LANGUAGE;
        const now = Date.now();
        const shouldBypassBackend = _isBackendTtsDown && (now - _lastBackendTtsAttemptTime < CIRCUIT_BREAKER_COOLDOWN_MS);

        const prefetchPromise = (async () => {
            if (!shouldBypassBackend) {
                for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt++) {
                    if (speechPlaybackGenRef.current !== playbackRunId || ac.signal.aborted) return;
                    try {
                        const res = await fetch('/api/tts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: chunkText, language: langForApi, speaker: eSpeaker, pace: eSpeed }),
                            signal: ac.signal,
                        });
                        if (res.ok) {
                            const blob = await res.blob();
                            if (blob && blob.size > 0) {
                                prefetchCache.current[chunkText] = { blob, type: 'api' };
                                return;
                            }
                        }
                    } catch {
                        // silent fallback
                    }
                }
            }

            if (speechPlaybackGenRef.current !== playbackRunId || ac.signal.aborted) return;
            try {
                const dataUri = await aiService.fetchSarvamTTS(chunkText, targetLang, eSpeaker);
                prefetchCache.current[chunkText] = { dataUri, type: 'sarvam' };
            } catch {
                prefetchCache.current[chunkText] = { type: 'browser' };
            }
        })();

        prefetchCache.current[chunkText] = { promise: prefetchPromise, type: 'loading' };
        try {
            await prefetchPromise;
        } catch {
            // silent catch
        }
    }, []);

    /**
     * Speaks a single chunk through the 3-tier pipeline (Backend Sarvam → Client Sarvam → Browser).
     */
    const speakSingleChunk = useCallback(async (
        chunk: string,
        targetLang: string,
        eSpeaker: string,
        eSpeed: number,
        eVoice: string,
        marker: string | null,
        ac: AbortController,
        consecutiveSarvamFails: { count: number },
        playbackRunId: number,
    ): Promise<boolean> => {
        const langForApi = targetLang || DEFAULT_TTS_LANGUAGE;

        while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
            await sleep(80);
        }
        if (speechPlaybackGenRef.current !== playbackRunId) return false;
        if (ac.signal.aborted || userStoppedPlaybackRef.current) return false;

        // 1. Wait for prefetch if already loading
        let cached = prefetchCache.current[chunk];
        if (cached?.type === 'loading' && cached.promise) {
            try {
                await cached.promise;
            } catch {
                // Ignore
            }
            cached = prefetchCache.current[chunk];
        }

        // 2. Play from prefetch cache if hit
        if (cached) {
            if (cached.type === 'api' && cached.blob) {
                if (isMountedRef.current) setIsFetchingAudio(false);
                await playAudioBlob(cached.blob, chunk, marker, playbackRunId);
                return true;
            } else if (cached.type === 'sarvam' && cached.dataUri) {
                if (isMountedRef.current) setIsFetchingAudio(false);
                await forEachSarvamWavChunk(
                    cached.dataUri,
                    async (_blob, chunkIndex) => {
                        while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
                            await sleep(80);
                        }
                        if (speechPlaybackGenRef.current !== playbackRunId || ac.signal.aborted || userStoppedPlaybackRef.current) {
                            throw new DOMException('Aborted', 'AbortError');
                        }
                        await playAudioBlob(_blob, chunk, chunkIndex === 0 ? marker : null, playbackRunId);
                    },
                    { signal: ac.signal },
                );
                return true;
            } else if (cached.type === 'browser') {
                if (isMountedRef.current) setIsFetchingAudio(false);
                const voice = getCachedVoice(targetLang, eVoice);
                if (voice && isVoiceCompatibleWithLanguage(voice, targetLang)) {
                    await playBrowserChunk(chunk, targetLang, marker, eVoice, eSpeed, playbackRunId);
                } else if (targetLang.toLowerCase().startsWith('en')) {
                    await playBrowserChunk(chunk, targetLang, marker, eVoice, eSpeed, playbackRunId);
                } else {
                    if (marker) {
                        window.dispatchEvent(new CustomEvent('speech-active-chunk', { detail: { chunkText: chunk } }));
                    }
                    await sleep(chunk.length * 60);
                }
                return true;
            }
        }

        // 3. Otherwise, fetch normally (Tier 1 -> Tier 2 -> Tier 3)
        const now = Date.now();
        const shouldBypassBackend = _isBackendTtsDown && (now - _lastBackendTtsAttemptTime < CIRCUIT_BREAKER_COOLDOWN_MS);

        if (!shouldBypassBackend && consecutiveSarvamFails.count < 5) {
            for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt++) {
                try {
                    while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
                        await sleep(80);
                    }
                    if (speechPlaybackGenRef.current !== playbackRunId) return false;
                    if (ac.signal.aborted || userStoppedPlaybackRef.current) return false;
                    const res = await fetch('/api/tts', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: chunk, language: langForApi, speaker: eSpeaker, pace: eSpeed }),
                        signal: ac.signal,
                    });
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    const blob = await res.blob();
                    if (!blob || blob.size === 0) throw new Error('Empty audio');
                    consecutiveSarvamFails.count = 0;
                    _backendTtsFailureCount = 0;
                    _isBackendTtsDown = false;
                    if (isMountedRef.current) setIsFetchingAudio(false);
                    while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
                        await sleep(80);
                    }
                    if (speechPlaybackGenRef.current !== playbackRunId) return false;
                    if (ac.signal.aborted || userStoppedPlaybackRef.current) return false;
                    await playAudioBlob(blob, chunk, marker, playbackRunId);
                    return true;
                } catch {
                    if (ac.signal.aborted || speechPlaybackGenRef.current !== playbackRunId) return false;
                    _backendTtsFailureCount++;
                    if (_backendTtsFailureCount >= 3) {
                        _isBackendTtsDown = true;
                        _lastBackendTtsAttemptTime = Date.now();
                        console.warn('[useSpeech] TTS backend is down. Tripping circuit breaker to bypass latency.');
                    }
                }
            }
        }

        try {
            if (speechPlaybackGenRef.current !== playbackRunId) return false;
            const dataUri = await aiService.fetchSarvamTTS(chunk, targetLang, eSpeaker);
            if (speechPlaybackGenRef.current !== playbackRunId) return false;
            if (ac.signal.aborted) return false;
            consecutiveSarvamFails.count = 0;
            if (isMountedRef.current) setIsFetchingAudio(false);
            await forEachSarvamWavChunk(
                dataUri,
                async (_blob, chunkIndex) => {
                    while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
                        await sleep(80);
                    }
                    if (speechPlaybackGenRef.current !== playbackRunId || ac.signal.aborted || userStoppedPlaybackRef.current) {
                        throw new DOMException('Aborted', 'AbortError');
                    }
                    await playAudioBlob(_blob, chunk, chunkIndex === 0 ? marker : null, playbackRunId);
                },
                { signal: ac.signal },
            );
            return true;
        } catch {
            if (ac.signal.aborted || speechPlaybackGenRef.current !== playbackRunId) return false;
            consecutiveSarvamFails.count++;
        }

        if (isMountedRef.current) setIsFetchingAudio(false);
        while (isPausedRef.current && !ac.signal.aborted && !userStoppedPlaybackRef.current) {
            await sleep(80);
        }
        if (speechPlaybackGenRef.current !== playbackRunId) return false;
        if (ac.signal.aborted || userStoppedPlaybackRef.current) return false;

        const voice = getCachedVoice(targetLang, eVoice);
        if (voice && isVoiceCompatibleWithLanguage(voice, targetLang)) {
            await playBrowserChunk(chunk, targetLang, marker, eVoice, eSpeed, playbackRunId);
        } else if (targetLang.toLowerCase().startsWith('en')) {
            await playBrowserChunk(chunk, targetLang, marker, eVoice, eSpeed, playbackRunId);
        } else {
            if (marker) {
                window.dispatchEvent(new CustomEvent('speech-active-chunk', { detail: { chunkText: chunk } }));
            }
            await sleep(chunk.length * 60);
        }
        return true;
    }, [playAudioBlob, playBrowserChunk, sleep]);

    useEffect(() => {
        const runId = ++speechPlaybackGenRef.current;
        const isStale = () => speechPlaybackGenRef.current !== runId;

        const cancelResources = () => {
            abortRef.current?.abort();
            abortRef.current = null;
            if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
            if (iosKeepAliveRef.current) { clearInterval(iosKeepAliveRef.current); iosKeepAliveRef.current = null; }
            if (audioRef.current) { 
                audioRef.current.pause(); 
                audioRef.current.removeAttribute('src');
                audioRef.current.load();
                audioRef.current = null; 
            }
            if (isMountedRef.current) {
                setSpeaking(false);
                setIsFetchingAudio(false);
            }
        };

        const cancel = () => {
            speechPlaybackGenRef.current++;
            cancelResources();
        };

        // Do not gate on isPaused — pausing must not tear down this effect or playback restarts from the top.
        // Allow manual trigger (Start Listening click) to bypass the ttsEnabled setting gate.
        const isManualTrigger = manualTriggerRef.current;
        manualTriggerRef.current = false;
        if (!isMuted && isAudioEnabled && (ttsEnabled || isManualTrigger) && currentStepData?.spokenContent) {
            unlockAudioContext();

            const eLang = ttsLang;
            const eSpeaker = ttsSpeaker;
            const eVoice = ttsVoice;
            const eSpeed = ttsSpeed;

            const run = async () => {
                prefetchCache.current = {};
                userStoppedPlaybackRef.current = false;
                const raw = currentStepData.spokenContent;
                if (!raw || !isMountedRef.current) return;
                // Only abort if settings changed AFTER this run started
                if (isStale()) return;

                const exitIfUserStopped = (): boolean => {
                    if (!userStoppedPlaybackRef.current) return false;
                    userStoppedPlaybackRef.current = false;
                    if (isMountedRef.current) setSpeaking(false);
                    window.dispatchEvent(new CustomEvent('speech-end', { detail: { stepId: currentStepData.id } }));
                    return true;
                };

                const markerRe = /\[(VISUAL|TEXT):([^\]]+)\]/g;
                const segs: { marker?: string; text: string }[] = [];
                let last = 0;
                let match;
                while ((match = markerRe.exec(raw)) !== null) {
                    const before = stripMarkers(raw.substring(last, match.index)).trim();
                    if (before) segs.push({ text: before });
                    const kind = match[1];
                    const payload = match[2];
                    const markerKey = kind === 'TEXT' ? `TEXT:${payload}` : payload;
                    segs.push({ marker: markerKey, text: '' });
                    last = match.index + match[0].length;
                }
                const trail = stripMarkers(raw.substring(last)).trim();
                if (trail) segs.push({ text: trail });
                if (segs.length === 0) segs.push({ text: stripMarkers(raw) });

                // Always use Accessibility → Teacher language (same as session `language` from settings).
                const targetLang = eLang;

                window.dispatchEvent(new CustomEvent('speech-start', { detail: { stepId: currentStepData.id } }));

                const textSegs = segs.map(s => ({ marker: s.marker, tts: normText(s.text) })).filter(s => s.tts.length > 0 || s.marker);

                // Track consecutive Sarvam failures across chunks (resets on success)
                const sarvamFails = { count: 0 };
                
                const startSeg = activeSegIndexRef.current;
                let startChunk = activeChunkIndexRef.current;

                for (let segIdx = startSeg; segIdx < textSegs.length; segIdx++) {
                    if (isStale()) break;
                    activeSegIndexRef.current = segIdx;
                    const seg = textSegs[segIdx];
                    
                    while (isPausedRef.current && !isStale() && !userStoppedPlaybackRef.current) {
                        await sleep(80);
                    }
                    if (isStale()) break;
                    if (exitIfUserStopped()) return;
                    if (seg.marker && !seg.tts) { emitVisualMarker(seg.marker); continue; }

                    const chunks = splitChunks(seg.tts);
                    const initialChunkIdx = (segIdx === startSeg) ? startChunk : 0;
                    
                    for (let i = initialChunkIdx; i < chunks.length; i++) {
                        if (isStale()) break;
                        activeChunkIndexRef.current = i;
                        while (isPausedRef.current && !isStale() && !userStoppedPlaybackRef.current) {
                            await sleep(80);
                        }
                        if (isStale()) break;
                        if (exitIfUserStopped()) return;
                        const chunk = chunks[i];
                        if (!chunk) continue;
                        const marker = i === 0 ? (seg.marker || null) : null;
                        const ac = new AbortController();
                        abortRef.current = ac;
                        if (isMountedRef.current) setIsFetchingAudio(true);

                        // Trigger prefetch for the next chunk in background
                        let nextChunkText: string | null = null;
                        if (i + 1 < chunks.length) {
                            nextChunkText = chunks[i + 1];
                        } else if (segIdx + 1 < textSegs.length) {
                            const nextSeg = textSegs[segIdx + 1];
                            if (nextSeg.tts) {
                                const nextSegChunks = splitChunks(nextSeg.tts);
                                if (nextSegChunks[0]) {
                                    nextChunkText = nextSegChunks[0];
                                }
                            }
                        }

                        if (nextChunkText) {
                            void prefetchChunk(nextChunkText, targetLang, eSpeaker, eSpeed, ac, runId);
                        }

                        try {
                            await speakSingleChunk(chunk, targetLang, eSpeaker, eSpeed, eVoice, marker, ac, sarvamFails, runId);
                        } finally {
                            if (isMountedRef.current) setIsFetchingAudio(false);
                            abortRef.current = null;
                        }
                        if (isStale()) break;
                        if (exitIfUserStopped()) return;
                    }
                    // Reset startChunk for subsequent segments
                    startChunk = 0;
                }

                if (isMountedRef.current && !isStale()) {
                    setSpeaking(false);
                    // Reset trackers so next play of same step starts at 0 unless interrupted
                    activeSegIndexRef.current = 0;
                    activeChunkIndexRef.current = 0;
                }
                if (!isStale() && isMountedRef.current) {
                    window.dispatchEvent(new CustomEvent('speech-end', { detail: { stepId: currentStepData.id } }));
                }
            };

            run();
        } else {
            cancel();
        }

        return () => cancel();
    }, [currentStepData?.id, currentStepData?.spokenContent, isMuted, isAudioEnabled, ttsEnabled, ttsLang, ttsSpeaker, ttsSpeed, ttsVoice, playbackTrigger, setSpeaking, normText, splitChunks, playAudioBlob, playBrowserChunk, speakSingleChunk, prefetchChunk, mobile, sleep]);

    return { isMuted, setIsMuted, isAudioEnabled, setIsAudioEnabled, isFetchingAudio };
}
