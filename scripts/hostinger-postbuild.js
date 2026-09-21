const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const backendDir = path.join(rootDir, 'backend');
const backendDist = path.join(backendDir, 'dist');
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
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      // Ignore broken symlinks or unreadable files
    }
  }
}

function linkOrCopy(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  try {
    fs.symlinkSync(src, dest, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (e) {
    copyDirSync(src, dest);
  }
}

function patchStandaloneServer(serverFilePath) {
  if (!fs.existsSync(serverFilePath)) return;
  try {
    const content = fs.readFileSync(serverFilePath, 'utf8');
    if (content.includes('[Hostinger Standalone] Launching NestJS Backend')) return;

    const backendForkSnippet = `
const _path = require('path');
const _fs = require('fs');
const _cp = require('child_process');

try {
  const _candidates = [
    _path.resolve(__dirname, 'backend', 'dist', 'main.js'),
    _path.resolve(__dirname, '..', 'backend', 'dist', 'main.js'),
    _path.resolve(__dirname, '..', '..', 'backend', 'dist', 'main.js'),
    _path.resolve(__dirname, '..', '..', '..', 'backend', 'dist', 'main.js'),
    _path.resolve(__dirname, '..', '..', '..', '..', 'backend', 'dist', 'main.js'),
    _path.resolve(process.cwd(), 'backend', 'dist', 'main.js'),
    _path.resolve(process.cwd(), '..', 'backend', 'dist', 'main.js'),
    _path.resolve(process.cwd(), '..', '..', 'backend', 'dist', 'main.js'),
  ];
  const _targetBackend = _candidates.find((c) => _fs.existsSync(c)) || null;

  if (_targetBackend) {
    const _backendPort = process.env.BACKEND_PORT || '3009';
    console.log('[Hostinger Standalone] Launching NestJS Backend process on internal port ' + _backendPort + ' from ' + _targetBackend + '...');

    const _nodePaths = [
      _path.resolve(__dirname, 'node_modules'),
      _path.resolve(__dirname, 'backend', 'node_modules'),
      _path.resolve(__dirname, '..', 'node_modules'),
      _path.resolve(__dirname, '..', 'backend', 'node_modules'),
      _path.resolve(__dirname, '..', '..', 'node_modules'),
      _path.resolve(__dirname, '..', '..', 'backend', 'node_modules'),
      _path.resolve(__dirname, '..', '..', '..', 'node_modules'),
      _path.resolve(__dirname, '..', '..', '..', 'backend', 'node_modules'),
      _path.resolve(process.cwd(), 'node_modules'),
      _path.resolve(process.cwd(), 'backend', 'node_modules'),
      _path.resolve(process.cwd(), '..', 'node_modules'),
      _path.resolve(process.cwd(), '..', 'backend', 'node_modules'),
    ].filter(p => _fs.existsSync(p)).join(_path.delimiter);

    const _backendEnv = Object.assign({}, process.env, {
      PORT: _backendPort,
      NODE_PATH: _nodePaths + (process.env.NODE_PATH ? _path.delimiter + process.env.NODE_PATH : '')
    });

    const _startBackend = () => {
      const _backendProc = _cp.fork(_targetBackend, [], { env: _backendEnv, stdio: 'inherit' });
      _backendProc.on('error', (err) => console.error('[Hostinger Standalone] Backend process error:', err));
      _backendProc.on('exit', (code, signal) => {
        console.warn('[Hostinger Standalone] Backend process exited with code ' + code + ', signal ' + signal + '. Restarting in 2s...');
        setTimeout(_startBackend, 2000);
      });
    };
    _startBackend();

    // Tell Next.js SSR to fetch from this backend port
    process.env.API_INTERNAL_BASE_URL = 'http://127.0.0.1:' + _backendPort + '/api/v1';
  } else {
    console.error('[Hostinger Standalone] ERROR: Could not locate backend/dist/main.js in standalone environment! Tried:', _candidates);
  }
} catch (e) {
  console.warn('[Hostinger Standalone] Could not auto-launch backend process:', e.message);
}
`;
    fs.writeFileSync(serverFilePath, backendForkSnippet + '\n' + content, 'utf8');
    console.log('[Hostinger Postbuild] Patched standalone server:', serverFilePath);
  } catch (err) {
    console.error('[Hostinger Postbuild] Failed to patch standalone server:', serverFilePath, err);
  }
}

console.log('[Hostinger Postbuild] Processing Next.js standalone static assets & backend bundle...');

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

// 3. Link/copy compiled NestJS backend & node_modules into standalone directories
if (fs.existsSync(backendDist)) {
  if (fs.existsSync(webStandalone)) {
    linkOrCopy(backendDir, path.join(webStandalone, 'backend'));
    linkOrCopy(backendDir, path.join(webStandalone, 'web', 'backend'));
  }
  if (fs.existsSync(path.join(rootNext, 'standalone'))) {
    linkOrCopy(backendDir, path.join(rootNext, 'standalone', 'backend'));
    linkOrCopy(backendDir, path.join(rootNext, 'standalone', 'web', 'backend'));
  }
  console.log('[Hostinger Postbuild] Compiled NestJS Backend bundled into standalone folders successfully.');
}

// 4. Patch standalone server.js files to auto-launch backend
if (fs.existsSync(webStandalone)) {
  patchStandaloneServer(path.join(webStandalone, 'server.js'));
  patchStandaloneServer(path.join(webStandalone, 'web', 'server.js'));
}

// 5. Copy web/.next to root .next
if (fs.existsSync(webNext)) {
  try {
    if (fs.existsSync(rootNext) && rootNext !== webNext) {
      fs.rmSync(rootNext, { recursive: true, force: true });
    }
    copyDirSync(webNext, rootNext);
    console.log('[Hostinger Postbuild] Root .next directory copied successfully.');
  } catch (err) {
    console.error('[Hostinger Postbuild] Error copying root .next:', err);
  }
} else {
  console.error('[Hostinger Postbuild] ERROR: web/.next directory not found!');
}

// Patch root .next standalone files if present
patchStandaloneServer(path.join(rootNext, 'standalone', 'server.js'));
patchStandaloneServer(path.join(rootNext, 'standalone', 'web', 'server.js'));
