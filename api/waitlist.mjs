import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WAITLIST_DIR = join(process.cwd(), '.data');
const WAITLIST_FILE = join(WAITLIST_DIR, 'waitlist.jsonl');

function appendWaitlistEntry(entry) {
  if (!existsSync(WAITLIST_DIR)) mkdirSync(WAITLIST_DIR, { recursive: true });
  appendFileSync(WAITLIST_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = String(body?.email ?? '').trim().toLowerCase();
    const courseName = String(body?.courseName ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Valid email is required' });
    if (!courseName) return res.status(400).json({ ok: false, error: 'Course name is required' });
    const entry = { email, courseName, createdAt: new Date().toISOString(), source: 'professional-learning-waitlist' };
    appendWaitlistEntry(entry);
    console.log('[waitlist]', JSON.stringify(entry));
    return res.status(200).json({ ok: true, message: 'Added to waitlist' });
  } catch (err) {
    console.error('[waitlist] error', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
