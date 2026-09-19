import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function saveTextsPlugin() {
  return {
    name: 'save-texts-middleware',
    configureServer(server) {
      server.middlewares.use('/api/save-texts', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const targetPath = path.resolve(__dirname, 'src/content/appTexts.json');
              fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
              console.log('[API] Successfully saved custom texts to', targetPath);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              console.error('[API] Error saving texts:', e.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), saveTextsPlugin()],
  server: {
    port: 3000,
    host: true
  }
});

