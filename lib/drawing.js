import { dot, line } from './bitmap.js';

export function paintSketch(bitmap, strokes, bounds) {
  const project = ([x, y]) => [
    bounds.x + x * (bounds.width - 1) / 719,
    bounds.y + y * (bounds.height - 1) / 319
  ];
  for (const item of strokes) {
    const stroke = Array.isArray(item) ? { points: item, size: 3, tool: 'pen' } : item;
    if (!stroke.points.length) continue;
    const radius = Math.max(0, Math.round(stroke.size / 2));
    const color = stroke.tool === 'eraser' ? 1 : 0;
    if (stroke.points.length === 1) {
      dot(bitmap, ...project(stroke.points[0]), radius, color);
      continue;
    }
    for (let i = 1; i < stroke.points.length; i++) {
      line(bitmap, ...project(stroke.points[i - 1]), ...project(stroke.points[i]), radius, color);
    }
  }
}