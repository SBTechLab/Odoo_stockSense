import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { routes } from './routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (env.isDev) app.use(morgan('dev', { skip: (req) => req.originalUrl === '/api/events' }));

app.get('/api/health', async (_req, res) => {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'down';
  }
  res.status(db === 'ok' ? 200 : 503).json({
    success: db === 'ok',
    data: { status: db === 'ok' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()), time: new Date().toISOString() },
  });
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);
