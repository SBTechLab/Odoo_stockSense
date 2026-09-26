import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { env } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

/** Shared Prisma client (single instance for the whole process). */
export const prisma = new PrismaClient({
  adapter,
  log: env.isDev ? ['warn', 'error'] : ['error'],
});

export { Prisma } from '../generated/prisma/index.js';
