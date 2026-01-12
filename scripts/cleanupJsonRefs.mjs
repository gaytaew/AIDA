#!/usr/bin/env node

/**
 * Cleanup Script: Remove refs and promptJson from saved images
 * 
 * These fields are large (refs can be 1MB+ per image) and are not needed
 * for history - they're only for current UI display.
 * 
 * Run: node scripts/cleanupJsonRefs.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_DIR = path.join(__dirname, '../src/backend/store/custom-shoots');

async function cleanupShoot(filename) {
  const filePath = path.join(STORE_DIR, filename);
  const shootId = filename.replace('.json', '');
  
  // Read shoot JSON
  let shoot;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    shoot = JSON.parse(content);
  } catch (err) {
    console.error(`  ❌ Failed to read/parse ${shootId}: ${err.message}`);
    return { ok: false, shootId, error: err.message };
  }
  
  if (!shoot.generatedImages || shoot.generatedImages.length === 0) {
    return { ok: true, shootId, cleaned: 0 };
  }
  
  let cleanedCount = 0;
  let savedBytes = 0;
  
  // Process each image
  for (const image of shoot.generatedImages) {
    let imageClean = false;
    
    if (image.refs) {
      savedBytes += JSON.stringify(image.refs).length;
      delete image.refs;
      imageClean = true;
    }
    
    if (image.promptJson) {
      savedBytes += JSON.stringify(image.promptJson).length;
      delete image.promptJson;
      imageClean = true;
    }
    
    if (imageClean) {
      cleanedCount++;
    }
  }
  
  if (cleanedCount === 0) {
    return { ok: true, shootId, cleaned: 0, saved: 0 };
  }
  
  // Save updated shoot JSON
  try {
    await fs.writeFile(filePath, JSON.stringify(shoot, null, 2), 'utf-8');
    console.log(`  ✅ ${shootId}: cleaned ${cleanedCount} images, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error(`  ❌ Failed to save ${shootId}: ${err.message}`);
    return { ok: false, shootId, error: err.message };
  }
  
  return { ok: true, shootId, cleaned: cleanedCount, saved: savedBytes };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AIDA Cleanup: Remove refs and promptJson from history');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Check if store directory exists
  try {
    await fs.access(STORE_DIR);
  } catch {
    console.error('❌ Store directory not found:', STORE_DIR);
    process.exit(1);
  }
  
  // Get all JSON files
  const files = await fs.readdir(STORE_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${jsonFiles.length} shoot files\n`);
  
  const results = [];
  
  for (const file of jsonFiles) {
    const result = await cleanupShoot(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  CLEANUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.ok);
  const totalCleaned = successful.reduce((sum, r) => sum + (r.cleaned || 0), 0);
  const totalSaved = successful.reduce((sum, r) => sum + (r.saved || 0), 0);
  
  console.log(`✅ Processed: ${successful.length}/${results.length} shoots`);
  console.log(`🧹 Images cleaned: ${totalCleaned}`);
  console.log(`💾 Space saved: ${(totalSaved / 1024 / 1024).toFixed(1)} MB`);
  
  // Show disk usage
  try {
    const { execSync } = await import('child_process');
    const size = execSync(`du -sh "${STORE_DIR}" 2>/dev/null || echo "N/A"`, { encoding: 'utf-8' }).trim();
    console.log(`\n📂 Custom shoots directory: ${size.split('\t')[0]}`);
  } catch {}
  
  console.log('\n✨ Cleanup complete!\n');
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

