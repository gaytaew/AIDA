/**
 * Image Converter Utility
 * 
 * Converts images to JPEG format for consistent storage.
 */

import sharp from 'sharp';

/**
 * Convert base64 image to JPEG format
 * @param {string} base64 - Base64 encoded image data
 * @param {string} mimeType - Original MIME type
 * @param {number} quality - JPEG quality (1-100), default 90
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
export async function convertToJpeg(base64, mimeType = 'image/png', quality = 90) {
  // If already JPEG with acceptable quality, return as-is
  if (mimeType === 'image/jpeg') {
    return { base64, mimeType: 'image/jpeg' };
  }
  
  try {
    const inputBuffer = Buffer.from(base64, 'base64');
    
    const outputBuffer = await sharp(inputBuffer)
      .jpeg({ quality })
      .toBuffer();
    
    const outputBase64 = outputBuffer.toString('base64');
    
    console.log(`[ImageConverter] Converted ${mimeType} to JPEG (${Math.round(inputBuffer.length/1024)}KB → ${Math.round(outputBuffer.length/1024)}KB)`);
    
    return {
      base64: outputBase64,
      mimeType: 'image/jpeg'
    };
  } catch (error) {
    console.error('[ImageConverter] Conversion failed:', error.message);
    // Return original if conversion fails
    return { base64, mimeType };
  }
}

/**
 * Convert image result from Gemini to JPEG
 * @param {{mimeType: string, base64: string}} image - Image from Gemini
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<{mimeType: string, base64: string}>}
 */
export async function convertGeminiImageToJpeg(image, quality = 90) {
  if (!image || !image.base64) {
    return image;
  }
  
  return await convertToJpeg(image.base64, image.mimeType, quality);
}

export default { convertToJpeg, convertGeminiImageToJpeg };


