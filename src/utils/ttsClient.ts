/**
 * Shared TTS client for lesson voice, settings preview, and doubt speech.
 * Handles both binary audio/wav (tutor api/tts) and JSON { audio: base64 }
 * (landing Next.js /api/tts) so same-origin proxy setups always play sound.
 */

import { API_ROUTES } from '../lib/apiRoutes';

export type TtsFetchOptions = {
    text: string;
    language?: string;
    speaker?: string;
    pace?: number;
    signal?: AbortSignal;
};

function base64ToWavBlob(b64: string): Blob {
    const clean = b64.includes(',') ? (b64.split(',').pop() || b64) : b64;
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/wav' });
}

/** Normalize a /api/tts Response into a playable audio Blob. */
export async function parseTtsResponseToBlob(res: Response): Promise<Blob> {
    if (!res.ok) {
        throw new Error(`TTS status ${res.status}`);
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 32) {
        throw new Error('Empty TTS audio');
    }

    const head = new TextDecoder().decode(buf.slice(0, 24)).trimStart();
    const looksJson =
        ct.includes('json') ||
        ct.includes('text/') ||
        head.startsWith('{');

    if (looksJson) {
        let data: { audio?: string; audios?: string[]; error?: string };
        try {
            data = JSON.parse(new TextDecoder().decode(buf));
        } catch {
            throw new Error('Invalid TTS JSON');
        }
        if (data?.error) throw new Error(String(data.error));
        const b64 = data?.audio || data?.audios?.[0];
        if (!b64 || typeof b64 !== 'string') {
            throw new Error('No audio in TTS JSON');
        }
        return base64ToWavBlob(b64);
    }

    const type = ct.startsWith('audio/') ? ct.split(';')[0].trim() : 'audio/wav';
    return new Blob([buf], { type });
}

/** POST /api/tts and return a playable audio Blob. */
export async function fetchTtsAudioBlob(opts: TtsFetchOptions): Promise<Blob> {
    const text = typeof opts.text === 'string' ? opts.text.trim() : '';
    if (!text) throw new Error('Missing TTS text');

    const res = await fetch(API_ROUTES.tts, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'audio/wav, application/json',
        },
        body: JSON.stringify({
            text,
            language: opts.language,
            speaker: opts.speaker,
            pace: opts.pace,
        }),
        signal: opts.signal,
    });

    return parseTtsResponseToBlob(res);
}
