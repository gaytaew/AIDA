/**
 * Image Collage Utility
 * 
 * Builds a single collage/grid image from multiple reference images.
 * Used for packing identity references into one board.
 */

import sharp from 'sharp';

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function normalizeFit(value, fallback) {
  const v = String(value || '').trim();
  const allowed = new Set(['cover', 'contain', 'fill', 'inside', 'outside']);
  return allowed.has(v) ? v : fallback;
}

function normalizePosition(value, fallback) {
  const v = String(value || '').trim();
  if (v === 'center') return 'centre';
  return v || fallback;
}

function normalizeRefs(images) {
  const list = Array.isArray(images) ? images : [];
  return list
    .filter(Boolean)
    .filter(x => x && typeof x === 'object')
    .map(x => ({
      mimeType: typeof x.mimeType === 'string' && x.mimeType ? x.mimeType : 'image/jpeg',
      base64: typeof x.base64 === 'string' ? x.base64 : ''
    }))
    .filter(x => x.base64 && x.base64.length > 0);
}

function pickBestGrid({ n, maxSize, minTile = 24, maxCols = 64 }) {
  const nn = clampInt(n, 1, Number.MAX_SAFE_INTEGER);
  const maxColsAllowed = clampInt(maxCols, 1, 256);
  const minTileAllowed = clampInt(minTile, 1, 256);

  let best = null;
  const colsUpper = Math.max(1, Math.min(nn, maxColsAllowed));

  for (let cols = 1; cols <= colsUpper; cols++) {
    const rows = Math.ceil(nn / cols);
    const tile = Math.floor(Math.min(maxSize / cols, maxSize / rows));
    if (tile <= 0) continue;
    if (tile < minTileAllowed && best) continue;
    const width = cols * tile;
    const height = rows * tile;
    if (width <= 0 || height <= 0) continue;
    if (width > maxSize || height > maxSize) continue;

    const cand = { cols, rows, tile, width, height };
    if (!best) {
      best = cand;
      continue;
    }
    if (cand.tile > best.tile) {
      best = cand;
      continue;
    }
    if (cand.tile === best.tile && cand.rows < best.rows) {
      best = cand;
      continue;
    }
  }

  if (!best) {
    for (let cols = 1; cols <= colsUpper; cols++) {
      const rows = Math.ceil(nn / cols);
      const tile = Math.floor(Math.min(maxSize / cols, maxSize / rows));
      if (tile <= 0) continue;
      const width = cols * tile;
      const height = rows * tile;
      if (width > maxSize || height > maxSize) continue;
      const cand = { cols, rows, tile, width, height };
      if (!best || cand.tile > best.tile || (cand.tile === best.tile && cand.rows < best.rows)) {
        best = cand;
      }
    }
  }

  return best || { cols: 1, rows: 1, tile: maxSize, width: maxSize, height: maxSize };
}

/**
 * Build a collage from multiple images
 * @param {Array<{mimeType: string, base64: string}>} images
 * @param {Object} options
 * @returns {Promise<{mimeType: string, base64: string}|null>}
 */
export async function buildCollage(images, options = {}) {
  const refsAll = normalizeRefs(images);
  const hardCap = clampInt(options.maxItems ?? 16, 1, 64);
  const refs = refsAll.slice(0, hardCap);

  if (refs.length === 0) return null;
  if (refs.length === 1) {
    return { mimeType: refs[0].mimeType, base64: refs[0].base64 };
  }

  const maxSize = clampInt(options.maxSize ?? 2048, 512, 2048);
  const background = typeof options.background === 'string' && options.background ? options.background : '#ffffff';
  const jpegQuality = clampInt(options.jpegQuality ?? 90, 60, 95);
  const fit = normalizeFit(options.fit, 'cover');
  const position = normalizePosition(options.position, 'centre');

  const { cols, rows, tile, width, height } = pickBestGrid({
    n: refs.length,
    maxSize,
    minTile: clampInt(options.minTile ?? 256, 1, 512),
    maxCols: clampInt(options.maxCols ?? 4, 1, 8)
  });

  const tileBuffers = (
    await Promise.all(
      refs.map(async (img) => {
        try {
          const input = Buffer.from(img.base64, 'base64');
          return await sharp(input, { failOn: 'none' })
            .rotate()
            .resize(tile, tile, { fit, position, background })
            .jpeg({ quality: jpegQuality })
            .toBuffer();
        } catch (e) {
          console.warn('[Collage] Failed to process image:', e.message);
          return null;
        }
      })
    )
  ).filter(Boolean);

  if (tileBuffers.length === 0) return null;
  if (tileBuffers.length === 1) {
    return { mimeType: 'image/jpeg', base64: tileBuffers[0].toString('base64') };
  }

  const composites = tileBuffers.map((buf, idx) => {
    const x = (idx % cols) * tile;
    const y = Math.floor(idx / cols) * tile;
    return { input: buf, left: x, top: y };
  });

  const board = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background
    }
  })
    .composite(composites)
    .jpeg({ quality: jpegQuality })
    .toBuffer();

  return { mimeType: 'image/jpeg', base64: board.toString('base64') };
}

/**
 * Build identity collage (optimized for face identity)
 * 
 * IMPORTANT: Face references need HIGH quality to preserve:
 * - Facial structure (eye spacing, nose, jawline)
 * - Skin texture and freckles
 * - Hair pattern and color
 * 
 * Settings rationale:
 * - maxSize: 1536 — large enough for face details
 * - minTile: 512 — each face is at least 512px (critical for recognition)
 * - maxCols: 2 — fewer faces per row = bigger individual tiles
 * - jpegQuality: 95 — near-lossless to preserve subtle features
 * - position: 'attention' — Sharp's smart crop that focuses on faces
 */
export async function buildIdentityCollage(images, options = {}) {
  return await buildCollage(images, {
    maxSize: options.maxSize ?? 1536,
    jpegQuality: options.jpegQuality ?? 95,
    background: options.background ?? '#ffffff',
    fit: options.fit ?? 'cover',
    position: options.position ?? 'attention',  // Smart crop for faces
    minTile: options.minTile ?? 512,            // Each face at least 512px
    maxCols: options.maxCols ?? 2               // Fewer columns = bigger faces
  });
}

// ═══════════════════════════════════════════════════════════════
// SMART MASONRY COLLAGE (for clothing references)
// ═══════════════════════════════════════════════════════════════

/**
 * Get optimal layout for N images (no empty cells)
 * Returns array of rows, each row has slot definitions
 */
function getSmartLayout(n) {
  switch (n) {
    case 1:
      return [[1]]; // Single image, full width
    case 2:
      return [[1, 1]]; // 2 side by side
    case 3:
      return [[1, 1, 1]]; // 3 in a row
    case 4:
      return [[1, 1], [1, 1]]; // 2x2 grid
    case 5:
      return [[1, 1, 1], [1.5, 1.5]]; // 3 top, 2 bottom (centered, 1.5x width each)
    case 6:
      return [[1, 1, 1], [1, 1, 1]]; // 3x2 grid
    case 7:
      return [[1, 1, 1, 1], [1.33, 1.33, 1.33]]; // 4 top, 3 bottom
    case 8:
      return [[1, 1, 1, 1], [1, 1, 1, 1]]; // 4x2 grid
    default:
      // For 9+, use 3 columns
      const rows = [];
      let remaining = n;
      while (remaining > 0) {
        const inRow = Math.min(3, remaining);
        rows.push(Array(inRow).fill(1));
        remaining -= inRow;
      }
      return rows;
  }
}

/**
 * Build a smart collage with adaptive layout (no empty cells)
 * Each image is scaled to fit its slot while preserving aspect ratio (no cropping)
 * 
 * @param {Array<{mimeType: string, base64: string}>} images
 * @param {Object} options
 * @returns {Promise<{mimeType: string, base64: string}|null>}
 */
export async function buildSmartCollage(images, options = {}) {
  const refsAll = normalizeRefs(images);
  const hardCap = clampInt(options.maxItems ?? 16, 1, 64);
  const refs = refsAll.slice(0, hardCap);

  if (refs.length === 0) return null;
  if (refs.length === 1) {
    // Single image: just resize to max size while preserving aspect ratio
    try {
      const input = Buffer.from(refs[0].base64, 'base64');
      const maxSize = clampInt(options.maxSize ?? 4096, 512, 4096);
      const jpegQuality = clampInt(options.jpegQuality ?? 95, 60, 95);

      const resized = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: jpegQuality })
        .toBuffer();

      return { mimeType: 'image/jpeg', base64: resized.toString('base64') };
    } catch (e) {
      console.warn('[SmartCollage] Failed to process single image:', e.message);
      return { mimeType: refs[0].mimeType, base64: refs[0].base64 };
    }
  }

  const maxSize = clampInt(options.maxSize ?? 4096, 512, 4096);
  const background = typeof options.background === 'string' && options.background ? options.background : '#ffffff';
  const jpegQuality = clampInt(options.jpegQuality ?? 95, 60, 95);
  const gap = clampInt(options.gap ?? 4, 0, 32);

  // Get layout
  const layout = getSmartLayout(refs.length);
  const numRows = layout.length;

  // Calculate row height based on max size and number of rows
  const totalGapHeight = gap * (numRows - 1);
  const rowHeight = Math.floor((maxSize - totalGapHeight) / numRows);

  // Process each image and calculate positions
  const composites = [];
  let imageIndex = 0;
  let currentY = 0;

  for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
    const row = layout[rowIdx];
    const numCols = row.length;
    const totalWeight = row.reduce((sum, w) => sum + w, 0);
    const totalGapWidth = gap * (numCols - 1);
    const availableWidth = maxSize - totalGapWidth;

    let currentX = 0;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      if (imageIndex >= refs.length) break;

      const weight = row[colIdx];
      const slotWidth = Math.floor((availableWidth * weight) / totalWeight);
      const slotHeight = rowHeight;

      try {
        const input = Buffer.from(refs[imageIndex].base64, 'base64');
        const metadata = await sharp(input).metadata();
        const imgWidth = metadata.width || 100;
        const imgHeight = metadata.height || 100;

        // Calculate size to fit inside slot while preserving aspect ratio
        const imgRatio = imgWidth / imgHeight;
        const slotRatio = slotWidth / slotHeight;

        let resizeWidth, resizeHeight;
        if (imgRatio > slotRatio) {
          // Image is wider than slot - fit by width
          resizeWidth = slotWidth;
          resizeHeight = Math.round(slotWidth / imgRatio);
        } else {
          // Image is taller than slot - fit by height
          resizeHeight = slotHeight;
          resizeWidth = Math.round(slotHeight * imgRatio);
        }

        // Resize image
        const resized = await sharp(input, { failOn: 'none' })
          .rotate()
          .resize(resizeWidth, resizeHeight, { fit: 'fill' })
          .jpeg({ quality: jpegQuality })
          .toBuffer();

        // Center image in slot
        const offsetX = Math.floor((slotWidth - resizeWidth) / 2);
        const offsetY = Math.floor((slotHeight - resizeHeight) / 2);

        composites.push({
          input: resized,
          left: currentX + offsetX,
          top: currentY + offsetY
        });

      } catch (e) {
        console.warn('[SmartCollage] Failed to process image:', e.message);
      }

      currentX += slotWidth + gap;
      imageIndex++;
    }

    currentY += rowHeight + gap;
  }

  if (composites.length === 0) return null;

  // Calculate actual canvas size (remove trailing gap)
  const canvasWidth = maxSize;
  const canvasHeight = currentY - gap;

  // Create canvas and composite all images
  const board = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background
    }
  })
    .composite(composites)
    .jpeg({ quality: jpegQuality })
    .toBuffer();

  // Trim white borders
  let finalBuffer = board;
  try {
    finalBuffer = await sharp(board)
      .trim({ background, threshold: 10 })
      .jpeg({ quality: jpegQuality })
      .toBuffer();
  } catch (e) {
    console.warn('[SmartCollage] Trim failed, using untrimmed:', e.message);
  }

  return { mimeType: 'image/jpeg', base64: finalBuffer.toString('base64') };
}
