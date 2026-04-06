/**
 * QR Code generator — uses 'qrcode' npm package for reliable, scannable QR codes.
 * Returns PNG buffer.
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code PNG buffer
 * @param {string} text - Data to encode
 * @param {number} size - Image size in pixels (default 200)
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function generateQRCode(text, size = 200) {
  const buf = await QRCode.toBuffer(text, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
  return buf;
}
