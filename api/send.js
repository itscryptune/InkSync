import { putSketch } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return res.status(415).json({ error: 'Send JSON content.' });
  }
  const body = req.body;
  if (!body || JSON.stringify(body).length > 110000) {
    return res.status(413).json({ error: 'This sketch is too large.' });
  }
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  if (!author || author.length > 32 || /[\r\n<>]/.test(author)) {
    return res.status(400).json({ error: 'Please enter a name (up to 32 characters).' });
  }
  if (!Array.isArray(body.strokes) || body.strokes.length > 120) {
    return res.status(400).json({ error: 'Invalid sketch.' });
  }
  let count = 0;
  for (const item of body.strokes) {
    const legacy = Array.isArray(item);
    const points = legacy ? item : item?.points;
    if (!Array.isArray(points) || points.length > 4000) {
      return res.status(400).json({ error: 'Invalid stroke.' });
    }
    if (!legacy && (Object.keys(item).some(key => !['points', 'size', 'tool'].includes(key)) ||
        !Number.isInteger(item.size) || item.size < 2 || item.size > 16 ||
        !['pen', 'eraser'].includes(item.tool))) {
      return res.status(400).json({ error: 'Invalid drawing tool.' });
    }
    count += points.length;
    if (count > 4000) return res.status(413).json({ error: 'Too many points.' });
    for (const point of points) {
      if (!Array.isArray(point) || point.length !== 2 ||
          !Number.isInteger(point[0]) || !Number.isInteger(point[1]) ||
          point[0] < 0 || point[0] > 719 || point[1] < 0 || point[1] > 319) {
        return res.status(400).json({ error: 'Invalid drawing coordinates.' });
      }
    }
  }
  if (count === 0) return res.status(400).json({ error: 'Draw something first.' });
  try {
    const saved = await putSketch(body.strokes, author);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, version: saved.version,
      author: saved.author, sent_at: saved.sentAt });
  } catch (error) {
    console.error('Sketch save failed:', error);
    return res.status(503).json({ error: 'Storage is unavailable. Try again.' });
  }
}