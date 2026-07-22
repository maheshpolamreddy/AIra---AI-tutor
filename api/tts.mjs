import crypto from 'node:crypto';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || '';
const HF_API_TOKEN = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY || '';
const MAX_TEXT_LENGTH = 2500;
const FETCH_TIMEOUT_MS = 15_000;

const SARVAM_LANGUAGE_MAP = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN',
  ml: 'ml-IN', kn: 'kn-IN', mr: 'mr-IN', bn: 'bn-IN',
  gu: 'gu-IN', pa: 'pa-IN', or: 'od-IN', od: 'od-IN',
};

const V2_SPEAKERS = new Set([
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh',
]);
const V3_SPEAKERS = new Set([
  'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran',
  'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun', 'manan',
  'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'ashutosh', 'advait',
  'amelia', 'sophia', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul',
  'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
]);

function getModelForSpeaker(speaker) {
  if (V2_SPEAKERS.has(speaker)) return 'bulbul:v2';
  if (V3_SPEAKERS.has(speaker)) return 'bulbul:v3';
  return 'bulbul:v2';
}

function normalizeLanguage(language) {
  const lang = String(language || '').trim().toLowerCase().replace('_', '-');
  if (!lang) return 'en';
  const strip = {
    'en-in': 'en', 'en-us': 'en', 'en-gb': 'en',
    'hi-in': 'hi', 'te-in': 'te', 'ta-in': 'ta',
    'ml-in': 'ml', 'kn-in': 'kn', 'mr-in': 'mr',
    'bn-in': 'bn', 'gu-in': 'gu', 'pa-in': 'pa',
    'or-in': 'or', 'od-in': 'od',
  };
  return strip[lang] || lang.split('-')[0] || 'en';
}

function normalizeSpeaker(speaker) {
  const s = String(speaker || '').trim().toLowerCase();
  if (!s || s === 'default') return 'anushka';
  if (V2_SPEAKERS.has(s) || V3_SPEAKERS.has(s)) return s;
  return 'anushka';
}

async function callSarvamTTS({ text, language, speaker, pace }) {
  if (!SARVAM_API_KEY) {
    return { ok: false, status: 503, message: 'SARVAM_API_KEY is not configured.' };
  }
  const targetLang = SARVAM_LANGUAGE_MAP[language];
  if (!targetLang) {
    return { ok: false, status: 400, message: `Language "${language}" is not supported.` };
  }
  const safeSpeaker = normalizeSpeaker(speaker);
  const model = getModelForSpeaker(safeSpeaker);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: [text], target_language_code: targetLang, speaker: safeSpeaker,
        model, pace: pace ?? 1.0, speech_sample_rate: 22050, enable_preprocessing: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      return { ok: false, status: response.status, message: await response.text() };
    }
    const json = await response.json();
    if (!json.audios?.[0]) {
      return { ok: false, status: 502, message: 'Sarvam returned no audio.' };
    }
    return { ok: true, audioBuffer: Buffer.from(json.audios[0], 'base64'), contentType: 'audio/wav' };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { ok: false, status: 504, message: 'Sarvam timed out.' };
    return { ok: false, status: 500, message: err.message || 'Sarvam call failed.' };
  }
}

async function callHuggingFaceTTS({ text, language }) {
  if (!HF_API_TOKEN) {
    return { ok: false, status: 503, message: 'HF_API_TOKEN not configured.' };
  }
  const MMS_MODELS = {
    en: 'facebook/mms-tts-eng', hi: 'facebook/mms-tts-hin', te: 'facebook/mms-tts-tel',
    ta: 'facebook/mms-tts-tam', ml: 'facebook/mms-tts-mal', kn: 'facebook/mms-tts-kan',
    mr: 'facebook/mms-tts-mar', bn: 'facebook/mms-tts-ben', gu: 'facebook/mms-tts-guj',
    pa: 'facebook/mms-tts-pan', or: 'facebook/mms-tts-ory',
  };
  const model = MMS_MODELS[language] || MMS_MODELS['en'];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_API_TOKEN}`, 'Content-Type': 'application/json', Accept: 'audio/flac, audio/wav, audio/mpeg, */*' },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return { ok: false, status: response.status, message: await response.text() };
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json') || ct.includes('text/')) {
      return { ok: false, status: 502, message: await response.text() };
    }
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length < 100) return { ok: false, status: 502, message: 'HF returned empty audio.' };
    return { ok: true, audioBuffer: buf, contentType: ct.startsWith('audio/') ? ct : 'audio/wav' };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { ok: false, status: 504, message: 'HF timed out.' };
    return { ok: false, status: 500, message: err.message || 'HF call failed.' };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const language = normalizeLanguage(req.body?.language);
    const speaker = normalizeSpeaker(req.body?.speaker);
    const pace = typeof req.body?.pace === 'number' ? req.body.pace : undefined;

    if (!text) return res.status(400).json({ error: 'Missing required field: text' });
    if (text.length > MAX_TEXT_LENGTH) return res.status(400).json({ error: `Text exceeds max length (${MAX_TEXT_LENGTH}).` });

    let result = await callSarvamTTS({ text, language, speaker, pace });

    if (!result.ok) {
      console.log(`[tts] Sarvam failed (${result.status}): ${result.message?.slice(0, 120)}`);
      result = await callHuggingFaceTTS({ text, language });
    }

    if (!result.ok) {
      console.log(`[tts] HF also failed (${result.status}): ${result.message?.slice(0, 120)}`);
      return res.status(result.status || 502).json({ error: result.message });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(result.audioBuffer);
  } catch (error) {
    console.error('[tts] unhandled:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown TTS error' });
  }
}
