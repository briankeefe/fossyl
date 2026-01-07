import type { ExpressAdapterOptions } from "../types";
import { emitCorsMiddleware } from "./cors";

/**
 * Emits the Express app setup boilerplate code.
 */
export function emitAppSetup(options: ExpressAdapterOptions): string {
  const corsSetup = options.cors ? emitCorsMiddleware(options.cors) : "";

  return `
const app = express();
app.use(express.json());
${corsSetup}
declare global {
  namespace Express {
    interface Request {
      fossylAuth?: unknown;
      fossylBody?: unknown;
    }
  }
}
`.trim();
}

/**
 * Emits the response wrapper helper function.
 */
export function emitResponseWrapper(wrapResponses: boolean): string {
  if (wrapResponses) {
    return `
function wrapResponse<T>(data: T): { data: T } {
  return { data };
}
`.trim();
  }

  return `
function wrapResponse<T>(data: T): T {
  return data;
}
`.trim();
}
