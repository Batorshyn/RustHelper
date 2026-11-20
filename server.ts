import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_ARTICLES,
  SEED_RECYCLE_ITEMS,
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
  const serverRecycleItems = SEED_RECYCLE_ITEMS.map((item) => ({
    ...item,
    yields: item.yields.map((y) => ({ ...y })),
  }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'RustHelperAPI',
      version: serverVersion,
      patchName: serverPatchName,
      articlesCount: serverArticles.length,
      recycleRulesCount: serverRecycleItems.length,
    });
  });

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
      recycleItems: serverRecycleItems,
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

  app.get('/api/recycle-rules', (_req, res) => {
    res.json(serverRecycleItems);
  });

  app.put('/api/recycle-rules/:itemId', (req, res) => {
    const itemId = Number(req.params.itemId);
    const { resourceId, amountPerUnit } = req.body || {};
    const parsedAmount = Number(amountPerUnit);

    if (
      !Number.isInteger(itemId) ||
      !resourceId ||
      !Number.isInteger(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 10000
    ) {
      res.status(400).json({ error: 'Некоректні параметри коефіцієнта переробки' });
      return;
    }

    const item = serverRecycleItems.find((i) => i.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Предмет не знайдено в правилах переробки' });
      return;
    }

    const rule = item.yields.find((y) => y.resourceId === resourceId);
    if (!rule) {
      res.status(404).json({ error: 'Ресурс для цього предмета не знайдено' });
      return;
    }

    rule.amountPerUnit = parsedAmount;
    serverVersion += 1;

    res.json({
      success: true,
      version: serverVersion,
      item,
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
