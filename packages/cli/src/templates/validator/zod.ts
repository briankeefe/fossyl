export function generateZodValidators(): string {
  return `import { z } from 'zod';
import { zodValidator, zodQueryValidator } from '@fossyl/zod';

// Create ping body schema
export const createPingSchema = z.object({
  message: z.string().min(1).max(255),
});

export const createPingValidator = zodValidator(createPingSchema);
export type CreatePingBody = z.infer<typeof createPingSchema>;

// Update ping body schema
export const updatePingSchema = z.object({
  message: z.string().min(1).max(255).optional(),
});

export const updatePingValidator = zodValidator(updatePingSchema);
export type UpdatePingBody = z.infer<typeof updatePingSchema>;

// List ping query schema
export const listPingQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export const listPingQueryValidator = zodQueryValidator(listPingQuerySchema);
export type ListPingQuery = z.infer<typeof listPingQuerySchema>;
`;
}
