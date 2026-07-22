const SARVAM_API_KEY = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || '';
const HF_API_TOKEN = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY || '';

export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    providers: {
      sarvam: { configured: Boolean(SARVAM_API_KEY), models: ['bulbul:v2', 'bulbul:v3'] },
      huggingface: { configured: Boolean(HF_API_TOKEN), model: 'facebook/mms-tts-*' },
    },
  });
}
