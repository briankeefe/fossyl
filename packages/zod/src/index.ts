import type { z } from 'zod';

/**
 * Create a type-safe validator from a Zod schema.
 * Extracts the inferred type so handlers receive properly typed data.
 *
 * @example
 * ```typescript
 * import { zodValidator } from '@fossyl/zod';
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * router.endpoint('/users').post({
 *   validator: zodValidator(userSchema),
 *   handler: async ({ url }, body) => {
 *     // body is { name: string, email: string }
 *     console.log(body.name);
 *   },
 * });
 * ```
 */
export function zodValidator<T extends z.ZodType>(
  schema: T
): (data: unknown) => z.infer<T> {
  return (data: unknown) => schema.parse(data);
}

/**
 * Create a type-safe query validator from a Zod schema.
 * Same as zodValidator, but semantically indicates query params.
 *
 * @example
 * ```typescript
 * const querySchema = z.object({
 *   page: z.coerce.number().default(1),
 *   limit: z.coerce.number().default(10),
 * });
 *
 * router.endpoint('/users').get({
 *   queryValidator: zodQueryValidator(querySchema),
 *   handler: async ({ url, query }) => {
 *     // query is { page: number, limit: number }
 *     console.log(query.page);
 *   },
 * });
 * ```
 */
export function zodQueryValidator<T extends z.ZodType>(
  schema: T
): (data: unknown) => z.infer<T> {
  return (data: unknown) => schema.parse(data);
}
