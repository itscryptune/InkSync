import { baseUrl, getSketch } from '../lib/store.js';

function sentLabel(value) {
  if (!value) return 'Not sent yet';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date(value));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  try {
    const sketch = await getSketch();
    const origin = baseUrl();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      has_sketch: sketch.version !== '0',
      sketch_author: sketch.author || 'Waiting for sketch',
      sketch_sent_at: sentLabel(sketch.sentAt),
      sent_at: sketch.sentAt,
      version: sketch.version,
      ink_url: `${origin}/api/ink?v=${encodeURIComponent(sketch.version)}`,
      qr_url: `${origin}/api/qr`,
      website_url: origin
    });
  } catch (error) {
    console.error('Sketch state failed:', error);
    return res.status(503).json({ error: 'Unable to load InkSync.' });
  }
}