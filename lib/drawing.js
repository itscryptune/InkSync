import { dot, line } from './bitmap.js';

export function paintSketch(bitmap, strokes, bounds) {
  const project = ([x, y]) => [
    bounds.x + x * (bounds.width - 1) / 719,
    bounds.y + y * (bounds.height - 1) / 319
  ];
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    if (stroke.length === 1) {
      dot(bitmap, ...project(stroke[0]), 1);
      continue;
    }
    for (let i = 1; i < stroke.length; i++) {
      line(bitmap, ...project(stroke[i - 1]), ...project(stroke[i]), 1);
    }
  }
} 