// Prisma 7 configuration (replaces the datasource url in schema.prisma and the
// "prisma" key in package.json). Loads server/.env so CLI commands work.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
