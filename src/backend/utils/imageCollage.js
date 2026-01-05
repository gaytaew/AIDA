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
 */
export async function buildIdentityCollage(images, options = {}) {
  return await buildCollage(images, {
    maxSize: options.maxSize ?? 2048,
    jpegQuality: options.jpegQuality ?? 92,
    background: options.background ?? '#ffffff',
    fit: options.fit ?? 'cover',
    position: options.position ?? 'centre',
    minTile: 400,
    maxCols: 3
  });
}

