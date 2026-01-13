#!/usr/bin/env node

/**
 * Migration Script: Convert base64 images in JSON to files on disk
 * 
 * This script:
 * 1. Reads all custom shoot JSON files
 * 2. Extracts base64 images from generatedImages array
 * 3. Saves them to store/images/{shootId}/{imageId}.jpg
 * 4. Updates JSON to store paths instead of data URLs
 * 
 * Run: node scripts/migrateImagesToFiles.mjs
 * 
 * IMPORTANT: Backup your data before running!
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_DIR = path.join(__dirname, '../src/backend/store/custom-shoots');
const IMAGES_DIR = path.join(__dirname, '../src/backend/store/images');

/**
 * Parse data URL to extract mime type and base64 data
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return null;
  }
  
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return map[mimeType] || 'jpg';
}

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function migrateShoot(filename) {
  const filePath = path.join(STORE_DIR, filename);
  const shootId = filename.replace('.json', '');
  
  console.log(`\n📂 Processing: ${shootId}`);
  
  // Read shoot JSON
  let shoot;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    shoot = JSON.parse(content);
  } catch (err) {
    console.error(`  ❌ Failed to read/parse: ${err.message}`);
    return { ok: false, shootId, error: err.message };
  }
  
  if (!shoot.generatedImages || shoot.generatedImages.length === 0) {
    console.log(`  ⏭️  No images to migrate`);
    return { ok: true, shootId, migrated: 0 };
  }
  
  // Create images directory for this shoot
  const shootImagesDir = path.join(IMAGES_DIR, shootId);
  await ensureDir(shootImagesDir);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  // Process each image
  for (const image of shoot.generatedImages) {
    if (!image.imageUrl) continue;
    
    // Skip if already migrated (path format)
    if (!image.imageUrl.startsWith('data:')) {
      skippedCount++;
      continue;
    }
    
    const parsed = parseDataUrl(image.imageUrl);
    if (!parsed) {
      console.log(`  ⚠️  Invalid data URL for image: ${image.id}`);
      continue;
    }
    
    const ext = getExtension(parsed.mimeType);
    const imageFilename = `${image.id}.${ext}`;
    const imageFilePath = path.join(shootImagesDir, imageFilename);
    
    // Write image file
    try {
      const buffer = Buffer.from(parsed.base64, 'base64');
      await fs.writeFile(imageFilePath, buffer);
      
      // Update image URL to path
      image.imageUrl = `${shootId}/${imageFilename}`;
      migratedCount++;
      
      console.log(`  ✅ Migrated: ${image.id} (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed to write ${image.id}: ${err.message}`);
    }
  }
  
  // Also update lock sourceImageUrls if they're data URLs
  if (shoot.locks?.style?.sourceImageUrl?.startsWith('data:')) {
    // Find the corresponding image path
    const sourceImage = shoot.generatedImages.find(img => img.id === shoot.locks.style.sourceImageId);
    if (sourceImage) {
      shoot.locks.style.sourceImageUrl = sourceImage.imageUrl;
      console.log(`  🔒 Updated style lock source URL`);
    }
  }
  
  if (shoot.locks?.location?.sourceImageUrl?.startsWith('data:')) {
    const sourceImage = shoot.generatedImages.find(img => img.id === shoot.locks.location.sourceImageId);
    if (sourceImage) {
      shoot.locks.location.sourceImageUrl = sourceImage.imageUrl;
      console.log(`  🔒 Updated location lock source URL`);
    }
  }
  
  // Save updated shoot JSON
  if (migratedCount > 0) {
    try {
      await fs.writeFile(filePath, JSON.stringify(shoot, null, 2), 'utf-8');
      console.log(`  💾 Saved updated JSON`);
    } catch (err) {
      console.error(`  ❌ Failed to save JSON: ${err.message}`);
      return { ok: false, shootId, error: err.message };
    }
  }
  
  console.log(`  📊 Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
  
  return { ok: true, shootId, migrated: migratedCount, skipped: skippedCount };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AIDA Image Migration: base64 → files');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Check if store directory exists
  try {
    await fs.access(STORE_DIR);
  } catch {
    console.error('❌ Store directory not found:', STORE_DIR);
    process.exit(1);
  }
  
  // Ensure images directory exists
  await ensureDir(IMAGES_DIR);
  
  // Get all JSON files
  const files = await fs.readdir(STORE_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`\n📁 Found ${jsonFiles.length} shoot files\n`);
  
  const results = [];
  
  for (const file of jsonFiles) {
    const result = await migrateShoot(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const successful = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const totalMigrated = successful.reduce((sum, r) => sum + (r.migrated || 0), 0);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length} shoots`);
  console.log(`📷 Total images migrated: ${totalMigrated}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} shoots`);
    failed.forEach(r => console.log(`  - ${r.shootId}: ${r.error}`));
  }
  
  // Show disk usage
  try {
    const { execSync } = await import('child_process');
    const size = execSync(`du -sh "${IMAGES_DIR}" 2>/dev/null || echo "N/A"`, { encoding: 'utf-8' }).trim();
    console.log(`\n💾 Images directory size: ${size.split('\t')[0]}`);
  } catch {}
  
  console.log('\n✨ Migration complete!\n');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});


