import { makeBitmap, toPng } from '../lib/bitmap.js';
import { paintSketch } from '../lib/drawing.js';
import { getSketch } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const record = await getSketch();
    const bitmap = makeBitmap(720, 320);
    paintSketch(bitmap, record.strokes, { x: 0, y: 0, width: 720, height: 320 });
    const image = toPng(bitmap);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(image.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(image);
  } catch (error) {
    console.error('Ink render failed:', error);
    return res.status(503).end('Image unavailable');
  }
}