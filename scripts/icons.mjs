import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { crc32 } from './zip.mjs';
function chunk(type, content) { const name = Buffer.from(type); const size = Buffer.alloc(4); size.writeUInt32BE(content.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, content]))); return Buffer.concat([size, name, content, crc]); }
function color(x, y) {
  const cornerX = Math.max(0, Math.abs(x - 64) - 35); const cornerY = Math.max(0, Math.abs(y - 64) - 35);
  if (cornerX * cornerX + cornerY * cornerY > 25 * 25) return [0, 0, 0, 0];
  const bar = x >= 34 && x <= 43 && y >= 38 && y <= 90;
  const play = x >= 59 && x <= 99 && Math.abs(y - 64) <= (99 - x) * 0.65;
  if (bar || play) return [212, 250, 235, 255];
  const light = (128 - y) / 128; return [24 + 5 * light, 65 + 14 * light, 54 + 12 * light, 255];
}
export async function makeIcons(directory) {
  await mkdir(directory, { recursive: true });
  for (const size of [16, 19, 32, 38, 48, 128]) {
    const rows = Buffer.alloc((size * 4 + 1) * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const channels = [0, 0, 0, 0];
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) { const sample = color((x + (sx + 0.5) / 4) * 128 / size, (y + (sy + 0.5) / 4) * 128 / size); for (let c = 0; c < 4; c++) channels[c] += sample[c]; }
      for (let c = 0; c < 4; c++) rows[y * (size * 4 + 1) + 1 + x * 4 + c] = Math.round(channels[c] / 16);
    }
    const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
    await writeFile(new URL('icon-' + size + '.png', directory), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]));
  }
}
