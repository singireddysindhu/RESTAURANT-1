const http = require('http');
const fs = require('fs');
const path = require('path');
const backend = require('./backend/server');

const port = Number(process.env.PORT || 3000);
const rootDir = __dirname;
const frontendDir = path.join(__dirname, 'frontend');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function send(res, statusCode, body, type) {
  res.writeHead(statusCode, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function resolvePath(requestPath) {
  const cleanPath = decodeURIComponent(requestPath.split('?')[0]);

  if (cleanPath === '/' || cleanPath === '') {
    return path.join(rootDir, 'index.html');
  }

  if (cleanPath.startsWith('/frontend/')) {
    return path.join(rootDir, cleanPath.slice(1));
  }

  const rootCandidate = path.join(rootDir, cleanPath.replace(/^\//, ''));
  if (fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
    return rootCandidate;
  }

  const frontendCandidate = path.join(frontendDir, cleanPath.replace(/^\//, ''));
  if (fs.existsSync(frontendCandidate) && fs.statSync(frontendCandidate).isFile()) {
    return frontendCandidate;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = req.url || '/';
  if (requestUrl.startsWith('/api/')) {
    backend.handleApiRequest(req, res);
    return;
  }

  const filePath = resolvePath(requestUrl);
  if (!filePath) {
    send(res, 404, 'Not Found');
    return;
  }

  const body = safeRead(filePath);
  if (!body) {
    send(res, 404, 'Not Found');
    return;
  }

  const type = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  send(res, 200, body, type);
});

server.listen(port, () => {
  console.log(`Guramrit Restro & Cafe server running on http://localhost:${port}`);
});