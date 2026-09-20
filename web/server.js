const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

// Ensure working directory is web/
process.chdir(__dirname);

// Automatically start NestJS Backend process on port 3000 if compiled dist/main.js exists
const backendDist = path.join(__dirname, '..', 'backend', 'dist', 'main.js');
if (fs.existsSync(backendDist)) {
  console.log('[Hostinger Web] Starting NestJS Backend process on internal port 3000...');
  const backendEnv = Object.assign({}, process.env, { PORT: process.env.BACKEND_PORT || '3000' });
  const backendProc = fork(backendDist, [], { env: backendEnv, stdio: 'inherit' });

  backendProc.on('error', (err) => {
    console.error('[Hostinger Web] Backend process error:', err);
  });
} else {
  console.warn('[Hostinger Web] backend/dist/main.js not found at:', backendDist);
}

const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let appReady = false;
const preparePromise = app.prepare().then(() => {
  appReady = true;
  console.log(`[Next.js] App prepared and ready on http://${hostname}:${port}`);
}).catch((err) => {
  console.error('[Next.js] Failed to prepare app:', err);
});

// Call listen() IMMEDIATELY so Hostinger's 3-second healthcheck passes instantly on boot
const server = createServer(async (req, res) => {
  try {
    if (!appReady) {
      await preparePromise;
    }
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error handling request:', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, (err) => {
  if (err) throw err;
  console.log(`[Hostinger] HTTP server listening immediately on port ${port}`);
});
