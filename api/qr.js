import { makeBitmap, toPng } from '../lib/bitmap.js';
import { paintQr } from '../lib/qr.js';
import { baseUrl } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const bitmap = makeBitmap(160, 160);
    paintQr(bitmap, baseUrl(), 0, 0, 160);
    const image = toPng(bitmap);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(image.length));
    res.setHeader('Cache-Control', 'public, max-age=600');
    return res.status(200).end(image);
  } catch (error) {
    console.error('QR render failed:', error);
    return res.status(503).end('QR unavailable');
  }
}