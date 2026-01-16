// lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Create a pg pool (Supabase usually needs SSL)
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Optional: avoid unhandled pool errors in dev
pool.on('error', (err) => {
  console.log('pg pool error (ignored):', err.message);
});

const adapter = new PrismaPg(pool);

// Use a global to avoid multiple Prisma instances in dev / hot reload
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // ✅ Prisma 7 needs adapter or accelerateUrl
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
