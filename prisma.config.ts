import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',           // for JS version
  },
  datasource: {
    url: env('DATABASE_URL'), // 👈 Prisma 7 wants the URL here
  },
});