/**
 * Minimal interface that any PrismaClient instance satisfies.
 *
 * We use a structural type rather than importing `PrismaClient` directly
 * because the concrete type is generated per-project by `prisma generate`.
 * This allows the adapter to work with any PrismaClient without requiring
 * a generated client at build time.
 *
 * Users should pass their generated `PrismaClient` instance and use
 * `getClient<PrismaClient>()` with their own generated type for full type safety.
 */
export type PrismaClientLike = {
  $transaction: <T>(
    fn: (tx: any) => Promise<T>,
    options?: any
  ) => Promise<T>;
  [key: string]: any;
};

/**
 * Transaction options for Prisma interactive transactions.
 *
 * These are passed directly to `client.$transaction()`.
 */
export type TransactionOptions = {
  /**
   * Maximum time in milliseconds to wait to acquire a transaction from the database.
   * @default 2000
   */
  maxWait?: number;

  /**
   * Maximum time in milliseconds for the interactive transaction to complete
   * before being cancelled and rolled back.
   * @default 5000
   */
  timeout?: number;

  /**
   * Transaction isolation level.
   * Supported values depend on the database (e.g., PostgreSQL supports all five).
   */
  isolationLevel?:
    | 'ReadUncommitted'
    | 'ReadCommitted'
    | 'RepeatableRead'
    | 'Snapshot'
    | 'Serializable';
};

/**
 * Configuration options for the Prisma adapter.
 */
export type PrismaAdapterOptions<TClient extends PrismaClientLike = PrismaClientLike> = {
  /** PrismaClient instance */
  client: TClient;

  /**
   * Run migrations automatically on startup.
   * When enabled, runs `migrationCommand` via child_process.
   * @default false
   */
  autoMigrate?: boolean;

  /**
   * Use transactions by default for write operations (POST/PUT).
   * @default true
   */
  defaultTransaction?: boolean;

  /**
   * Default transaction options applied to all `withTransaction` calls.
   * Individual calls cannot override these (Prisma applies them at the $transaction level).
   *
   * @example
   * ```typescript
   * prismaAdapter({
   *   client: prisma,
   *   transactionOptions: {
   *     timeout: 10000,
   *     isolationLevel: 'Serializable',
   *   },
   * });
   * ```
   */
  transactionOptions?: TransactionOptions;

  /**
   * Shell command to run for migrations on startup.
   * Only used when `autoMigrate` is true.
   * @default 'npx prisma migrate deploy'
   */
  migrationCommand?: string;
};
