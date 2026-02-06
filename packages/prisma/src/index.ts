// Main adapter
export { prismaAdapter } from './adapter';

// Context
export { getClient, isInTransaction, prismaContext } from './context';
export type { PrismaContext } from './context';

// Types
export type {
  PrismaAdapterOptions,
  PrismaClientLike,
  TransactionOptions,
} from './types';
