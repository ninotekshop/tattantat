const fs = require('fs');
const path = require('path');

const webNext = path.join(__dirname, '..', 'web', '.next');
const rootNext = path.join(__dirname, '..', '.next');

if (fs.existsSync(webNext)) {
  console.log(`[Hostinger Postbuild] Linking ${webNext} to ${rootNext}...`);
  try {
    if (fs.existsSync(rootNext)) {
      fs.rmSync(rootNext, { recursive: true, force: true });
    }
    try {
      fs.symlinkSync('web/.next', rootNext, 'junction');
      console.log('[Hostinger Postbuild] Root .next directory symlinked successfully.');
    } catch (e) {
      fs.cpSync(webNext, rootNext, { recursive: true });
      console.log('[Hostinger Postbuild] Root .next directory copied successfully.');
    }
  } catch (err) {
    console.error('[Hostinger Postbuild] Error linking root .next:', err);
  }
} else {
  console.error('[Hostinger Postbuild] ERROR: web/.next directory not found!');
}
