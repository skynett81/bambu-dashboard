/**
 * Minimal QR Code generator — pure JS, no dependencies.
 * Supports alphanumeric + byte mode, versions 1-10, ECC level L.
 * Returns PNG buffer.
 */

// GF(256) arithmetic for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a, b) { return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }

function rsEncode(data, nsym) {
  const gen = new Uint8Array(nsym + 1);
  gen[0] = 1;
  for (let i = 0; i < nsym; i++) {
    for (let j = nsym; j > 0; j--) gen[j] = gen[j - 1] ^ gfMul(gen[j], GF_EXP[i]);
    gen[0] = gfMul(gen[0], GF_EXP[i]);
  }
  const msg = new Uint8Array(data.length + nsym);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) for (let j = 0; j <= nsym; j++) msg[i + j] ^= gfMul(gen[j], coef);
  }
  return msg.slice(data.length);
}

// Version info: [totalCodewords, eccPerBlock, numBlocks, dataPerBlock]
const VERSION_INFO = [
  null, // v0
  [26, 7, 1, 19],    // v1: 21x21
  [44, 10, 1, 34],   // v2: 25x25
  [70, 15, 1, 55],   // v3: 29x29
  [100, 20, 1, 80],  // v4: 33x33
  [134, 26, 1, 108], // v5: 37x37
  [172, 18, 2, 68],  // v6: 41x41
  [196, 20, 2, 78],  // v7: 45x45
  [242, 24, 2, 97],  // v8: 49x49
  [292, 30, 2, 116], // v9: 53x53
  [346, 18, 4, 68],  // v10: 57x57
];

function selectVersion(dataLen) {
  for (let v = 1; v <= 10; v++) {
    const [, , , dataCap] = VERSION_INFO[v];
    if (dataLen <= dataCap) return v;
  }
  return 10; // clamp
}

function encodeData(text, version) {
  const [totalCW, eccPerBlock, numBlocks, dataPerBlock] = VERSION_INFO[version];
  const totalData = dataPerBlock * numBlocks;

  // Byte mode: mode=0100, length in 8 or 16 bits depending on version
  const lengthBits = version <= 9 ? 8 : 16;
  const bits = [];
  const push = (val, count) => { for (let i = count - 1; i >= 0; i--) bits.push((val >> i) & 1); };

  push(0b0100, 4); // byte mode
  push(text.length, lengthBits);
  for (let i = 0; i < text.length; i++) push(text.charCodeAt(i) & 0xFF, 8);
  push(0, 4); // terminator

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert to bytes
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((a, b, idx) => a | (b << (7 - idx)), 0));
  }

  // Pad with alternating bytes
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (data.length < totalData) {
    data.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // RS error correction
  const blockSize = Math.floor(totalData / numBlocks);
  const allData = [];
  const allEcc = [];
  for (let b = 0; b < numBlocks; b++) {
    const block = new Uint8Array(data.slice(b * blockSize, (b + 1) * blockSize));
    allData.push(block);
    allEcc.push(rsEncode(block, eccPerBlock));
  }

  // Interleave
  const result = [];
  const maxDataLen = Math.max(...allData.map(b => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < allData[b].length) result.push(allData[b][i]);
    }
  }
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) result.push(allEcc[b][i]);
  }

  return result;
}

function createMatrix(version) {
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Int8Array(size)); // 0=unset, 1=black, -1=white
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  // Finder patterns
  function finderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const isBlack = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                        (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        matrix[rr][cc] = isBlack ? 1 : -1;
        reserved[rr][cc] = 1;
      }
    }
  }
  finderPattern(0, 0);
  finderPattern(0, size - 7);
  finderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const v = (i % 2 === 0) ? 1 : -1;
    if (!reserved[6][i]) { matrix[6][i] = v; reserved[6][i] = 1; }
    if (!reserved[i][6]) { matrix[i][6] = v; reserved[i][6] = 1; }
  }

  // Dark module
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = 1;

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = 1; reserved[8][size - 1 - i] = 1;
    reserved[i][8] = 1; reserved[size - 1 - i][8] = 1;
  }
  reserved[8][8] = 1;

  // Alignment patterns (version >= 2)
  if (version >= 2) {
    const positions = [6, version * 4 + 10]; // simplified for v2-6
    for (const r of positions) {
      for (const c of positions) {
        if (reserved[r]?.[c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            if (reserved[rr][cc]) continue;
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            matrix[rr][cc] = isBlack ? 1 : -1;
            reserved[rr][cc] = 1;
          }
        }
      }
    }
  }

  return { matrix, reserved, size };
}

function placeData(matrix, reserved, size, codewords) {
  const bits = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (c < 0 || reserved[row][c]) continue;
        if (bitIdx < bits.length) {
          matrix[row][c] = bits[bitIdx] ? 1 : -1;
          bitIdx++;
        } else {
          matrix[row][c] = -1;
        }
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix, reserved, size) {
  // Mask 0: (row + col) % 2 == 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      if ((r + c) % 2 === 0) matrix[r][c] = matrix[r][c] === 1 ? -1 : 1;
    }
  }

  // Format info (mask 0, ECC level L = 01)
  // Pre-computed: format bits for L + mask 0 = 0b111011111000100
  const formatBits = 0b111011111000100;
  const formatPositions = [
    // Around top-left finder
    [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]],
    // Around other finders
    [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],[8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]]
  ];
  for (const positions of formatPositions) {
    for (let i = 0; i < 15; i++) {
      const [r, c] = positions[i];
      matrix[r][c] = ((formatBits >> (14 - i)) & 1) ? 1 : -1;
    }
  }
}

function matrixToPng(matrix, size, scale, margin) {
  const imgSize = size * scale + margin * 2;
  const pixels = new Uint8Array(imgSize * imgSize);
  pixels.fill(255); // white

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            pixels[(margin + r * scale + dy) * imgSize + (margin + c * scale + dx)] = 0;
          }
        }
      }
    }
  }

  // Encode as PNG (minimal uncompressed)
  return encodePNG(pixels, imgSize, imgSize);
}

function encodePNG(grayscale, width, height) {
  // Raw PNG encoder for grayscale
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(12 + data.length);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + data.length));
    buf.writeUInt32BE(crc, 8 + data.length);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT — uncompressed deflate
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter: none
    for (let x = 0; x < width; x++) rawRows.push(grayscale[y * width + x]);
  }
  const raw = Buffer.from(rawRows);

  // Deflate: stored blocks (no compression, simple)
  const blocks = [];
  let offset = 0;
  while (offset < raw.length) {
    const remaining = raw.length - offset;
    const blockSize = Math.min(remaining, 65535);
    const isLast = offset + blockSize >= raw.length;
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(blockSize, 1);
    header.writeUInt16LE(blockSize ^ 0xFFFF, 3);
    blocks.push(header, raw.slice(offset, offset + blockSize));
    offset += blockSize;
  }

  // Zlib wrapper
  const zlibHeader = Buffer.from([0x78, 0x01]); // deflate, no compression
  const deflated = Buffer.concat([zlibHeader, ...blocks]);

  // Adler-32
  let a = 1, b = 0;
  for (let i = 0; i < raw.length; i++) {
    a = (a + raw[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((b << 16) | a, 0);

  const idat = Buffer.concat([deflated, adler]);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend)
  ]);
}

// CRC32 lookup
const CRC_TABLE = new Int32Array(256);
{
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    CRC_TABLE[n] = c;
  }
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Generate a QR code PNG buffer
 * @param {string} text - Data to encode
 * @param {number} size - Image size in pixels (default 200)
 * @returns {Buffer} PNG image buffer
 */
export function generateQRCode(text, size = 200) {
  const version = selectVersion(text.length + 3); // +3 for mode/length overhead
  const codewords = encodeData(text, version);
  const { matrix, reserved, size: matrixSize } = createMatrix(version);
  placeData(matrix, reserved, matrixSize, codewords);
  applyMask(matrix, reserved, matrixSize);

  const scale = Math.max(1, Math.floor((size - 8) / matrixSize));
  const margin = Math.max(4, Math.floor((size - matrixSize * scale) / 2));
  return matrixToPng(matrix, matrixSize, scale, margin);
}
