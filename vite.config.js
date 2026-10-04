import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SYNC_FILE = path.resolve(__dirname, '.synced_layout.json');

function liveSyncPlugin() {
  let inMemoryState = {
    layout: null,
    wineNote: null,
    theme: 'parchment',
    step: 4,
    updatedAt: Date.now()
  };

  if (fs.existsSync(SYNC_FILE)) {
    try {
      const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
      inMemoryState = { ...inMemoryState, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Could not read existing sync file:', e);
    }
  }

  const persistState = () => {
    try {
      fs.writeFileSync(SYNC_FILE, JSON.stringify(inMemoryState, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist sync file:', e);
    }
  };

  return {
    name: 'winitis-live-sync',
    configureServer(server) {
      // 1. WebSocket custom event for ultra-fast low-latency push
      server.ws.on('winitis:sync-push', (payload) => {
        inMemoryState = {
          ...inMemoryState,
          ...payload,
          updatedAt: Date.now()
        };
        persistState();
        server.ws.send({
          type: 'custom',
          event: 'winitis:sync-pull',
          data: inMemoryState
        });
      });

      // 2. HTTP endpoints for fetch & fallback polling
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/live-sync') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            return res.end(JSON.stringify(inMemoryState));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                inMemoryState = {
                  ...inMemoryState,
                  ...parsed,
                  updatedAt: Date.now()
                };
                persistState();
                server.ws.send({
                  type: 'custom',
                  event: 'winitis:sync-pull',
                  data: inMemoryState
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, updatedAt: inMemoryState.updatedAt }));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), liveSyncPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
