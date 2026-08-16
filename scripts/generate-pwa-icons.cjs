const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. PNG Decoder
function decodePng(buf) {
  let offset = 8;
  let width, height;
  let idatBuffers = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
  const rawRgba = Buffer.alloc(width * height * 4);
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  let inOffset = 0;
  let prevRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[inOffset++];
    const currentRow = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const byte = decompressed[inOffset++];
      const a = x >= bytesPerPixel ? currentRow[x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      let val = 0;
      if (filterType === 0) val = byte;
      else if (filterType === 1) val = (byte + a) & 0xff;
      else if (filterType === 2) val = (byte + b) & 0xff;
      else if (filterType === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (byte + pr) & 0xff;
      }
      currentRow[x] = val;
      rawRgba[y * stride + x] = val;
    }
    prevRow = currentRow;
  }
  return { width, height, rawRgba };
}

// 2. PNG CRC & Encoder
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function encodePng(width, height, rawRgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const filtered = Buffer.alloc((stride + 1) * height);
  let outOff = 0;
  for (let y = 0; y < height; y++) {
    filtered[outOff++] = 0; // filter None
    rawRgba.copy(filtered, outOff, y * stride, (y + 1) * stride);
    outOff += stride;
  }

  const idat = zlib.deflateSync(filtered, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// 3. Bilinear / Area Resampler into Square Canvas
function renderSquareIcon(src, targetSize, paddingRatio = 0.05, bg = { r: 255, g: 255, b: 255, a: 0 }) {
  const out = Buffer.alloc(targetSize * targetSize * 4);
  
  // Fill background
  for (let i = 0; i < targetSize * targetSize; i++) {
    out[i * 4] = bg.r;
    out[i * 4 + 1] = bg.g;
    out[i * 4 + 2] = bg.b;
    out[i * 4 + 3] = bg.a;
  }

  const availSize = targetSize * (1 - paddingRatio * 2);
  const scale = Math.min(availSize / src.width, availSize / src.height);
  const destW = Math.round(src.width * scale);
  const destH = Math.round(src.height * scale);
  const destX = Math.round((targetSize - destW) / 2);
  const destY = Math.round((targetSize - destH) / 2);

  for (let dy = 0; dy < destH; dy++) {
    const sy = dy / scale;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, src.height - 1);
    const fy = sy - y0;

    for (let dx = 0; dx < destW; dx++) {
      const sx = dx / scale;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, src.width - 1);
      const fx = sx - x0;

      const idx00 = (y0 * src.width + x0) * 4;
      const idx10 = (y0 * src.width + x1) * 4;
      const idx01 = (y1 * src.width + x0) * 4;
      const idx11 = (y1 * src.width + x1) * 4;

      const targetIdx = ((destY + dy) * targetSize + (destX + dx)) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src.rawRgba[idx00 + c] * (1 - fx) + src.rawRgba[idx10 + c] * fx;
        const bot = src.rawRgba[idx01 + c] * (1 - fx) + src.rawRgba[idx11 + c] * fx;
        const val = Math.round(top * (1 - fy) + bot * fy);

        // Alpha composite over background if source has transparency
        if (c === 3) {
          out[targetIdx + 3] = Math.max(out[targetIdx + 3], val);
        } else {
          out[targetIdx + c] = val;
        }
      }
    }
  }

  return encodePng(targetSize, targetSize, out);
}

// Read base logo
const baseLogoPath = path.join(__dirname, '..', 'public', 'docframe-logo.png');
const basePng = decodePng(fs.readFileSync(baseLogoPath));

const publicDir = path.join(__dirname, '..', 'public');

// 1. pwa-192x192.png (purpose: "any")
fs.writeFileSync(
  path.join(publicDir, 'pwa-192x192.png'),
  renderSquareIcon(basePng, 192, 0.04, { r: 255, g: 255, b: 255, a: 0 })
);
console.log('✓ Generated public/pwa-192x192.png');

// 2. pwa-512x512.png (purpose: "any")
fs.writeFileSync(
  path.join(publicDir, 'pwa-512x512.png'),
  renderSquareIcon(basePng, 512, 0.04, { r: 255, g: 255, b: 255, a: 0 })
);
console.log('✓ Generated public/pwa-512x512.png');

// 3. pwa-maskable-512x512.png (purpose: "maskable" - safe zone requires ~15% padding on solid background)
fs.writeFileSync(
  path.join(publicDir, 'pwa-maskable-512x512.png'),
  renderSquareIcon(basePng, 512, 0.15, { r: 255, g: 255, b: 255, a: 255 })
);
console.log('✓ Generated public/pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180 for iOS)
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.png'),
  renderSquareIcon(basePng, 180, 0.08, { r: 255, g: 255, b: 255, a: 255 })
);
console.log('✓ Generated public/apple-touch-icon.png');
