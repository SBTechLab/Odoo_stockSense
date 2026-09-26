import { env } from './config/env.js';
import { app } from './app.js';
import { prisma } from './lib/prisma.js';
import { startBackgroundJobs } from './jobs/index.js';
import { verifyMailer } from './lib/mailer.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 StockSense API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  verifyMailer();
});

const stopJobs = startBackgroundJobs();

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  stopJobs();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // SSE connections keep the server open; force exit after a grace period.
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
