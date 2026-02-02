import type { ProjectOptions } from '../../prompts';

export function generatePingRoute(options: ProjectOptions): string {
  const validatorImport =
    options.validator === 'zod'
      ? `import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from '../validators/ping.validators';`
      : `import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from '../validators/ping.validators';`;

  return `import type { Router, AuthenticationFunction } from '@fossyl/core';
import * as pingService from '../services/ping.service';
${validatorImport}

/**
 * Ping feature routes demonstrating all 4 route types:
 * - OpenRoute: GET /api/ping (list all)
 * - OpenRoute: GET /api/ping/:id (get one)
 * - FullRoute: POST /api/ping (authenticated + validated)
 * - FullRoute: PUT /api/ping/:id (authenticated + validated)
 * - AuthenticatedRoute: DELETE /api/ping/:id (authenticated only)
 */
export function pingRoutes<T extends { userId: string }>(
  router: Router,
  authenticator: AuthenticationFunction<T>
) {
  // OpenRoute - List all pings (public)
  const listPings = router.createEndpoint('/ping').get({
    queryValidator: listPingQueryValidator,
    handler: async ({ query }) => {
      const pings = await pingService.listPings(query.limit, query.offset);
      return {
        typeName: 'PingList' as const,
        pings,
        limit: query.limit,
        offset: query.offset,
      };
    },
  });

  // OpenRoute - Get single ping (public)
  const getPing = router.createEndpoint('/ping/:id').get({
    handler: async ({ url }) => {
      const ping = await pingService.getPing(url.id);
      return {
        typeName: 'Ping' as const,
        ...ping,
      };
    },
  });

  // FullRoute - Create ping (authenticated + validated)
  const createPing = router.createEndpoint('/ping').post({
    authenticator,
    validator: createPingValidator,
    handler: async ({ url }, auth, body) => {
      const ping = await pingService.createPing(body.message, auth.userId);
      return {
        typeName: 'Ping' as const,
        ...ping,
      };
    },
  });

  // FullRoute - Update ping (authenticated + validated)
  const updatePing = router.createEndpoint('/ping/:id').put({
    authenticator,
    validator: updatePingValidator,
    handler: async ({ url }, auth, body) => {
      const ping = await pingService.updatePing(url.id, body, auth.userId);
      return {
        typeName: 'Ping' as const,
        ...ping,
      };
    },
  });

  // AuthenticatedRoute - Delete ping (authenticated only, no body)
  const deletePing = router.createEndpoint('/ping/:id').delete({
    authenticator,
    handler: async ({ url }, auth) => {
      await pingService.deletePing(url.id, auth.userId);
      return {
        typeName: 'DeleteResult' as const,
        id: url.id,
        deleted: true,
      };
    },
  });

  return [listPings, getPing, createPing, updatePing, deletePing];
}
`;
}

export function generatePingService(_options: ProjectOptions): string {
  return `import * as pingRepo from '../repo/ping.repo';

export interface PingData {
  id: number;
  message: string;
  created_by: string;
  created_at: Date;
}

export async function listPings(limit: number, offset: number): Promise<PingData[]> {
  return pingRepo.findAll(limit, offset);
}

export async function getPing(id: string): Promise<PingData> {
  const ping = await pingRepo.findById(id);
  if (!ping) {
    throw new Error('Ping not found');
  }
  return ping;
}

export async function createPing(message: string, userId: string): Promise<PingData> {
  return pingRepo.create({ message, created_by: userId });
}

export async function updatePing(
  id: string,
  data: { message?: string },
  userId: string
): Promise<PingData> {
  const existing = await pingRepo.findById(id);
  if (!existing) {
    throw new Error('Ping not found');
  }
  // Optional: Check if user owns the ping
  // if (existing.created_by !== userId) {
  //   throw new Error('Not authorized');
  // }
  return pingRepo.update(id, data);
}

export async function deletePing(id: string, userId: string): Promise<void> {
  const existing = await pingRepo.findById(id);
  if (!existing) {
    throw new Error('Ping not found');
  }
  // Optional: Check if user owns the ping
  // if (existing.created_by !== userId) {
  //   throw new Error('Not authorized');
  // }
  await pingRepo.remove(id);
}
`;
}

export function generatePingRepo(options: ProjectOptions): string {
  if (options.database === 'kysely') {
    return generateKyselyPingRepo();
  }
  return generateByoPingRepo();
}

function generateKyselyPingRepo(): string {
  return `import { getTransaction } from '@fossyl/kysely';
import type { DB, Ping, NewPing, PingUpdate } from '../../../types/db';

export async function findAll(limit: number, offset: number): Promise<Ping[]> {
  const db = getTransaction<DB>();
  return db
    .selectFrom('ping')
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
}

export async function findById(id: string): Promise<Ping | undefined> {
  const db = getTransaction<DB>();
  return db
    .selectFrom('ping')
    .where('id', '=', Number(id))
    .selectAll()
    .executeTakeFirst();
}

export async function create(data: Omit<NewPing, 'id' | 'created_at'>): Promise<Ping> {
  const db = getTransaction<DB>();
  return db
    .insertInto('ping')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function update(id: string, data: PingUpdate): Promise<Ping> {
  const db = getTransaction<DB>();
  return db
    .updateTable('ping')
    .set(data)
    .where('id', '=', Number(id))
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function remove(id: string): Promise<void> {
  const db = getTransaction<DB>();
  await db.deleteFrom('ping').where('id', '=', Number(id)).execute();
}
`;
}

function generateByoPingRepo(): string {
  return `/**
 * TODO: Implement database operations
 *
 * This file contains placeholder implementations.
 * Replace with your actual database queries using your chosen database client.
 */

export interface Ping {
  id: number;
  message: string;
  created_by: string;
  created_at: Date;
}

// In-memory store for demo purposes - replace with actual database
const pings: Map<number, Ping> = new Map();
let nextId = 1;

export async function findAll(limit: number, offset: number): Promise<Ping[]> {
  // TODO: Replace with actual database query
  const all = Array.from(pings.values());
  return all.slice(offset, offset + limit);
}

export async function findById(id: string): Promise<Ping | undefined> {
  // TODO: Replace with actual database query
  return pings.get(Number(id));
}

export async function create(data: { message: string; created_by: string }): Promise<Ping> {
  // TODO: Replace with actual database insert
  const ping: Ping = {
    id: nextId++,
    message: data.message,
    created_by: data.created_by,
    created_at: new Date(),
  };
  pings.set(ping.id, ping);
  return ping;
}

export async function update(id: string, data: { message?: string }): Promise<Ping> {
  // TODO: Replace with actual database update
  const numId = Number(id);
  const existing = pings.get(numId);
  if (!existing) {
    throw new Error('Not found');
  }
  const updated = { ...existing, ...data };
  pings.set(numId, updated);
  return updated;
}

export async function remove(id: string): Promise<void> {
  // TODO: Replace with actual database delete
  pings.delete(Number(id));
}
`;
}
