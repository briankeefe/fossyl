import type { DialectChoice } from '../prompts';

export function generateKyselySetup(dialect: DialectChoice = 'postgres'): string {
  if (dialect === 'sqlite') {
    return `import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { DB } from './types/db';

const databasePath = process.env.DATABASE_PATH || './data/app.db';

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database(databasePath),
  }),
});
`;
  }

  if (dialect === 'mysql') {
    return `import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';
import type { DB } from './types/db';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool(connectionString),
  }),
});
`;
  }

  // PostgreSQL (default)
  return `import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from './types/db';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString }),
  }),
});
`;
}

export function generateDbTypes(): string {
  return `import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Ping table types
export interface PingTable {
  id: Generated<string>;
  message: string;
  created_by: string;
  created_at: Generated<Date>;
}

export type Ping = Selectable<PingTable>;
export type NewPing = Insertable<PingTable>;
export type PingUpdate = Updateable<PingTable>;

// Database schema
export interface DB {
  ping: PingTable;
}
`;
}

export function generateMigrationIndex(): string {
  return `import { createMigrationProvider } from '@fossyl/kysely';
import { migration as m001 } from './001_create_ping';

export const migrations = createMigrationProvider({
  '001_create_ping': m001,
});
`;
}

export function generatePingMigration(dialect: DialectChoice = 'postgres'): string {
  if (dialect === 'sqlite') {
    return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('message', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) =>
        col.notNull().defaultTo(sql\`(datetime('now'))\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
  }

  if (dialect === 'mysql') {
    return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
      .addColumn('message', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_by', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql\`CURRENT_TIMESTAMP\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
  }

  // PostgreSQL (default)
  return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql\`gen_random_uuid()\`)
      )
      .addColumn('message', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_by', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql\`now()\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
}
