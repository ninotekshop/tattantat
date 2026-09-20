const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

// 1. Start NestJS Backend process if dist/main.js exists
const backendDist = path.join(__dirname, 'backend', 'dist', 'main.js');
if (fs.existsSync(backendDist)) {
  console.log('[Hostinger Entrypoint] Starting NestJS Backend process on internal port 3000...');
  const backendEnv = Object.assign({}, process.env, { PORT: process.env.BACKEND_PORT || '3000' });
  const backendProc = fork(backendDist, [], { env: backendEnv, stdio: 'inherit' });

  backendProc.on('error', (err) => {
    console.error('[Hostinger Entrypoint] Backend process error:', err);
  });
} else {
  console.warn('[Hostinger Entrypoint] backend/dist/main.js not found. Run "npm run build" to build backend.');
}

// 2. Switch working directory to web/ and start Next.js Web Frontend
const webDir = path.join(__dirname, 'web');
process.chdir(webDir);
console.log(`[Hostinger Entrypoint] Starting Next.js Web Frontend in ${webDir}...`);

require('./server.js');
