// Génère icon-192.png et icon-512.png (sprout cyan sur navy) sans dépendance externe.
const fs = require('fs');
const zlib = require('zlib');

// CRC32 (PNG)
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function ellipse(x, y, ex, ey, a, b, ang) {
  const dx = x - ex, dy = y - ey, c = Math.cos(-ang), s = Math.sin(-ang);
  const u = dx * c + dy * s, v = -dx * s + dy * c;
  return (u * u) / (a * a) + (v * v) / (b * b) <= 1;
}

function render(S) {
  const k = S / 512;
  const cx = 256 * k;
  const px = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const NAVY = px('#141d3a'), GLOW = px('#1d2a4d'),
        CYAN = px('#6ec6d8'), CYAN2 = px('#86d6e4'), LITE = px('#9fe0ee');
  const buf = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let col = NAVY;
      // glow doux
      if ((x - 256 * k) ** 2 + (y - 222 * k) ** 2 <= (150 * k) ** 2) col = GLOW;
      // tige
      if (Math.abs(x - cx) <= 10 * k && y >= 248 * k && y <= 384 * k) col = LITE;
      // feuille gauche
      if (ellipse(x, y, (256 - 46) * k, 274 * k, 64 * k, 26 * k, -35 * Math.PI / 180)) col = CYAN;
      // feuille droite
      if (ellipse(x, y, (256 + 46) * k, 262 * k, 64 * k, 26 * k, 35 * Math.PI / 180)) col = CYAN2;
      // bourgeon
      if ((x - 256 * k) ** 2 + (y - 230 * k) ** 2 <= (18 * k) ** 2) col = LITE;
      const o = (y * S + x) * 4;
      buf[o] = col[0]; buf[o + 1] = col[1]; buf[o + 2] = col[2]; buf[o + 3] = 255;
    }
  }
  // scanlines avec filtre 0
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync(__dirname + '/icon-512.png', render(512));
fs.writeFileSync(__dirname + '/icon-192.png', render(192));
console.log('OK 512 + 192 written');
