const path = require('path');
const fs = require('fs');

// 1. Switch working directory to web/ and start Next.js Web Frontend
// (web/server.js will automatically start the NestJS backend on port 3009)
const webDir = path.join(__dirname, 'web');
process.chdir(webDir);
console.log(`[Hostinger Entrypoint] Starting Next.js Web Frontend in ${webDir}...`);

require('./server.js');
