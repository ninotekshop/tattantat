const path = require('path');

// When deployed at repository root on Hostinger, change directory to web/
const webDir = path.join(__dirname, 'web');
process.chdir(webDir);

console.log(`[Hostinger Entrypoint] Working directory switched to: ${webDir}`);

require('./server.js');
