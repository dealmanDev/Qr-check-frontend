import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 80);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(filePath, response, contentType) {
  const extension = path.extname(filePath);
  response.writeHead(200, {
    'Content-Type': contentType || mimeTypes[extension] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = request.url || '/';

  if (url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('healthy');
    return;
  }

  if (url === '/favicon.ico' || url === '/favicon.svg') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const requestedPath = decodeURIComponent(url.split('?')[0]);
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath);

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isFile()) {
      sendFile(filePath, response);
      return;
    }
  } catch (_error) {
    // SPA fallback handled below.
  }

  const indexPath = path.join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    sendFile(indexPath, response);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend disponivel em http://0.0.0.0:${port}`);
});
