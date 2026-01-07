import type { CorsOptions, ExpressAdapterOptions } from "../types";

/**
 * Emits CORS middleware setup code.
 *
 * @param corsOption - CORS configuration (boolean or CorsOptions)
 * @returns TypeScript code for CORS middleware setup
 */
export function emitCorsMiddleware(
  corsOption: NonNullable<ExpressAdapterOptions["cors"]>
): string {
  if (corsOption === true) {
    // Default permissive CORS
    return `
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});
`;
  }

  // Custom CORS options
  const options = corsOption as CorsOptions;
  const origin = formatOrigin(options.origin);
  const methods = options.methods ?? "GET, POST, PUT, DELETE, OPTIONS";
  const allowedHeaders =
    options.allowedHeaders ??
    "Origin, X-Requested-With, Content-Type, Accept, Authorization";
  const credentials = options.credentials ?? false;

  return `
app.use((req: Request, res: Response, next: NextFunction) => {
  ${origin}
  res.header('Access-Control-Allow-Methods', '${methods}');
  res.header('Access-Control-Allow-Headers', '${allowedHeaders}');
  ${credentials ? "res.header('Access-Control-Allow-Credentials', 'true');" : ""}

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});
`;
}

/**
 * Formats the CORS origin configuration into code.
 */
function formatOrigin(origin: string | string[] | undefined): string {
  if (!origin) {
    return "res.header('Access-Control-Allow-Origin', '*');";
  }

  if (typeof origin === "string") {
    return `res.header('Access-Control-Allow-Origin', '${origin}');`;
  }

  // Array of origins - need dynamic checking
  const originsArray = JSON.stringify(origin);
  return `
  const allowedOrigins = ${originsArray};
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }`.trim();
}
