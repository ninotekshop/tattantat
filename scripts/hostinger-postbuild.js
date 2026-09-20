const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const webPublic = path.join(webDir, 'public');
const webNext = path.join(webDir, '.next');
const webStatic = path.join(webNext, 'static');
const webStandalone = path.join(webNext, 'standalone');
const rootNext = path.join(rootDir, '.next');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[Hostinger Postbuild] Processing Next.js standalone static assets & public files...');

// 1. Copy public assets into standalone directories
if (fs.existsSync(webPublic)) {
  copyDirSync(webPublic, path.join(rootDir, 'public'));
  if (fs.existsSync(webStandalone)) {
    copyDirSync(webPublic, path.join(webStandalone, 'public'));
    copyDirSync(webPublic, path.join(webStandalone, 'web', 'public'));
  }
  console.log('[Hostinger Postbuild] Public static assets (logos, images) copied successfully.');
}

// 2. Copy .next/static into standalone directories
if (fs.existsSync(webStatic) && fs.existsSync(webStandalone)) {
  copyDirSync(webStatic, path.join(webStandalone, '.next', 'static'));
  copyDirSync(webStatic, path.join(webStandalone, 'web', '.next', 'static'));
  console.log('[Hostinger Postbuild] .next/static build traces copied successfully.');
}

// 3. Link web/.next to root .next
if (fs.existsSync(webNext)) {
  try {
    if (fs.existsSync(rootNext)) {
      fs.rmSync(rootNext, { recursive: true, force: true });
    }
    try {
      fs.symlinkSync('web/.next', rootNext, 'junction');
      console.log('[Hostinger Postbuild] Root .next directory symlinked successfully.');
    } catch (e) {
      copyDirSync(webNext, rootNext);
      console.log('[Hostinger Postbuild] Root .next directory copied successfully.');
    }
  } catch (err) {
    console.error('[Hostinger Postbuild] Error linking root .next:', err);
  }
} else {
  console.error('[Hostinger Postbuild] ERROR: web/.next directory not found!');
}
