import QRCode from 'qrcode';
import { fillRect } from './bitmap.js';

export function paintQr(bitmap, address, left, top, availableSize) {
  const modules = QRCode.create(address, { errorCorrectionLevel: 'M' }).modules;
  const side = modules.size;
  const scale = Math.max(1, Math.floor(availableSize / (side + 8)));
  const used = (side + 8) * scale;
  const x0 = left + Math.floor((availableSize - used) / 2) + 4 * scale;
  const y0 = top + Math.floor((availableSize - used) / 2) + 4 * scale;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (modules.get(x, y)) fillRect(bitmap, x0 + x * scale, y0 + y * scale, scale, scale);
    }
  }
}
