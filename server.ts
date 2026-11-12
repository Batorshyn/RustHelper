import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_ARTICLES,
  CURRENT_SERVER_PACKAGE_VERSION,
  CURRENT_PATCH_NAME,
} from './src/entities/seedData';
import { IArticle } from './src/entities/models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Серверна БД довідника RustHelperAPI (Синхронізується з локальним кешем клієнта за UC8 та оновлюється за UC7)
  let serverVersion = CURRENT_SERVER_PACKAGE_VERSION;
  let serverPatchName = CURRENT_PATCH_NAME;
  const serverArticles: IArticle[] = SEED_ARTICLES.map((a) => ({ ...a }));

  // UC8: Отримання актуальної версії пакета даних на сервері
  app.get('/api/packages/version', (_req, res) => {
    res.json({
      version: serverVersion,
      patchName: serverPatchName,
    });
  });

  // UC8: Завантаження актуального пакета довідкових даних (DataPackage)
  app.get('/api/packages/latest', (_req, res) => {
    res.json({
      version: serverVersion,
      patchName: serverPatchName,
      sizeMb: 2.85,
      lastSyncedAt: new Date().toLocaleString('uk-UA'),
      articles: serverArticles,
    });
  });

  // UC1 & UC7: Список усіх статей на сервері
  app.get('/api/articles', (_req, res) => {
    res.json(serverArticles);
  });

  // UC1: Завантаження окремої статті з сервера за ID, коли її немає у локальному офлайн-кеші
  app.get('/api/articles/:id', (req, res) => {
    const id = Number(req.params.id);
    const article = serverArticles.find((a) => a.id === id);
    if (!article) {
      res.status(404).json({ error: 'Статтю не знайдено у серверній БД RustHelperAPI' });
      return;
    }
    res.json(article);
  });

  // UC7: Оновлення або створення статті Адміністратором (PUT /api/articles/:id)
  app.put('/api/articles/:id', (req, res) => {
    const id = Number(req.params.id);
    const payload = req.body as IArticle;

    if (!payload || !payload.title || payload.title.trim().length < 5) {
      res.status(400).json({ error: 'Некоректні дані статті (InputValidator)' });
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
