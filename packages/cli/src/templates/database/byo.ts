export function generateByoDatabasePlaceholder(): string {
  return `/**
 * TODO: Implement your database adapter
 *
 * This file should:
 * 1. Set up your database connection (Prisma, Drizzle, raw SQL, etc.)
 * 2. Export a database client or query builder
 * 3. Optionally implement transaction support
 *
 * Reference implementation: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely
 *
 * Example with Prisma:
 *
 * import { PrismaClient } from '@prisma/client';
 * export const db = new PrismaClient();
 *
 * Example with Drizzle:
 *
 * import { drizzle } from 'drizzle-orm/postgres-js';
 * import postgres from 'postgres';
 * const queryClient = postgres(process.env.DATABASE_URL!);
 * export const db = drizzle(queryClient);
 */

// Placeholder - replace with your database client
export const db = {
  // Add your database client here
  query: async (sql: string, params?: unknown[]) => {
    throw new Error('Database not implemented. See src/db.ts for instructions.');
  },
};
`;
}
