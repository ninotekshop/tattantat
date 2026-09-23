const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

// Ensure working directory is web/
process.chdir(__dirname);

// Choose an open port for the backend to avoid 3000 collision on Hostinger
let BACKEND_INTERNAL_PORT = process.env.BACKEND_PORT || '3009';
if (BACKEND_INTERNAL_PORT === (process.env.PORT || '3000')) {
  BACKEND_INTERNAL_PORT = '3009';
}
process.env.API_INTERNAL_BASE_URL = `http://127.0.0.1:${BACKEND_INTERNAL_PORT}/api/v1`;

const net = require('net');

function checkPortInUse(port, callback) {
  const client = new net.Socket();
  let connected = false;
  client.setTimeout(400);
  client.on('connect', () => {
    connected = true;
    client.destroy();
  });
  client.on('timeout', () => client.destroy());
  client.on('error', () => {});
  client.on('close', () => callback(connected));
  client.connect(Number(port), '127.0.0.1');
}

function startBackendProcess() {
  if (global.__HOSTINGER_WEB_BACKEND_STARTED__) return;
  global.__HOSTINGER_WEB_BACKEND_STARTED__ = true;

  checkPortInUse(BACKEND_INTERNAL_PORT, (inUse) => {
    if (inUse) {
      console.log(`[Hostinger Web] NestJS Backend already active on port ${BACKEND_INTERNAL_PORT}. Skipping fork.`);
      return;
    }

    const backendDist = path.join(__dirname, '..', 'backend', 'dist', 'main.js');
    if (fs.existsSync(backendDist)) {
      console.log(`[Hostinger Web] Starting NestJS Backend process on internal port ${BACKEND_INTERNAL_PORT}...`);

      const nodePaths = [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '..', 'node_modules'),
        path.resolve(__dirname, '..', 'backend', 'node_modules'),
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(process.cwd(), 'backend', 'node_modules'),
      ].filter(p => fs.existsSync(p)).join(path.delimiter);

      const backendEnv = Object.assign({}, process.env, {
        PORT: BACKEND_INTERNAL_PORT,
        NODE_PATH: nodePaths + (process.env.NODE_PATH ? path.delimiter + process.env.NODE_PATH : '')
      });

      const backendProc = fork(backendDist, [], { env: backendEnv, stdio: 'inherit' });

      backendProc.on('error', (err) => {
        console.error('[Hostinger Web] Backend process error:', err);
      });

      backendProc.on('exit', (code, signal) => {
        checkPortInUse(BACKEND_INTERNAL_PORT, (stillInUse) => {
          if (stillInUse) {
            console.log(`[Hostinger Web] Backend exited (code ${code}), but port ${BACKEND_INTERNAL_PORT} is active. Will not restart duplicated process.`);
          } else {
            console.warn(`[Hostinger Web] Backend process exited (code ${code}, signal ${signal}). Restarting in 2s...`);
            global.__HOSTINGER_WEB_BACKEND_STARTED__ = false;
            setTimeout(startBackendProcess, 2000);
          }
        });
      });
    } else {
      console.warn('[Hostinger Web] backend/dist/main.js not found at:', backendDist);
    }
  });
}

startBackendProcess();

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
