import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionPath = path.join(__dirname, '../src/frontend/version.json');

const versionData = {
    version: '1.0.0',
    buildTime: new Date().toISOString(),
    commit: process.env.GIT_COMMIT || 'HEAD'
};

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
console.log(`[Version] Updated buildTime to ${versionData.buildTime}`);
