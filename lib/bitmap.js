import { deflateSync } from 'node:zlib';

export function makeBitmap(width, height) {
  const stride = Math.ceil(width / 8);
  const pixels = Buffer.alloc(stride * height, 255);
  return { width, height, stride, pixels };
}
export function dot(bitmap, px, py, radius = 1, color = 0) {
  const cx = Math.round(px);
  const cy = Math.round(py);
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > (radius + 0.4) ** 2) continue;
      if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) continue;
      const index = y * bitmap.stride + Math.floor(x / 8);
      if (color) bitmap.pixels[index] |= 128 >> (x % 8);
      else bitmap.pixels[index] &= ~(128 >> (x % 8));
    }
  }
}
export function line(bitmap, x1, y1, x2, y2, radius = 1, color = 0) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
  for (let step = 0; step <= steps; step++) {
    dot(bitmap, x1 + (x2 - x1) * step / steps, y1 + (y2 - y1) * step / steps, radius, color);
  }
}
export function box(bitmap, x, y, width, height, radius = 0) {
  line(bitmap, x, y, x + width, y, radius);
  line(bitmap, x + width, y, x + width, y + height, radius);
  line(bitmap, x + width, y + height, x, y + height, radius);
  line(bitmap, x, y + height, x, y, radius);
}
export function fillRect(bitmap, x, y, width, height) {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) dot(bitmap, col, row, 0);
  }
}
function crc32(input) {
  let crc = 0xffffffff;
  for (const value of input) {
    crc ^= value;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, payload) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(payload.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, payload])));
  return Buffer.concat([length, name, payload, checksum]);
}
export function toPng(bitmap) {
  const info = Buffer.alloc(13);
  info.writeUInt32BE(bitmap.width, 0);
  info.writeUInt32BE(bitmap.height, 4);
  info[8] = 1;
  info[9] = 0;
  const image = Buffer.alloc((bitmap.stride + 1) * bitmap.height);
  for (let row = 0; row < bitmap.height; row++) {
    const offset = row * (bitmap.stride + 1);
    image[offset] = 0;
    bitmap.pixels.copy(image, offset + 1, row * bitmap.stride, (row + 1) * bitmap.stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', info),
    chunk('IDAT', deflateSync(image)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}