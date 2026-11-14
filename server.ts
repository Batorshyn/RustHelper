import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_ARTICLES,
  CURRENT_SERVER_PACKAGE_VERSION,
  CURRENT_PATCH_NAME,
} from './src/entities/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let serverVersion = CURRENT_SERVER_PACKAGE_VERSION;
  let serverPatchName = CURRENT_PATCH_NAME;
  const serverArticles = SEED_ARTICLES.map((a) => ({ ...a }));

  app.get('/api/packages/version', (_req, res) => {
    res.json({
      version: serverVersion,
      patchName: serverPatchName,
    });
  });

  app.get('/api/packages/latest', (_req, res) => {
    res.json({
      version: serverVersion,
      patchName: serverPatchName,
      sizeMb: 2.85,
      lastSyncedAt: new Date().toLocaleString('uk-UA'),
      articles: serverArticles,
    });
  });

  app.get('/api/articles', (_req, res) => {
    res.json(serverArticles);
  });

  app.get('/api/articles/:id', (req, res) => {
    const id = Number(req.params.id);
    const article = serverArticles.find((a) => a.id === id);
    if (!article) {
      res.status(404).json({ error: 'Статтю не знайдено у серверній БД RustHelperAPI' });
      return;
    }
    res.json(article);
  });

  app.put('/api/articles/:id', (req, res) => {
    const id = Number(req.params.id);
    const payload = req.body;

    if (!payload || !payload.title || String(payload.title).trim().length < 5) {
      res.status(400).json({ error: 'Некоректні дані статті' });
      return;
    }

    const idx = serverArticles.findIndex((a) => a.id === id);
    if (idx >= 0) {
      serverArticles[idx] = { ...serverArticles[idx], ...payload, id };
    } else {
      serverArticles.unshift({ ...payload, id });
    }

    serverVersion += 1;
    res.json({
      success: true,
      version: serverVersion,
      article: payload,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RustHelper Server running on http://localhost:${PORT}`);
  });
}

startServer();
