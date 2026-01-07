// Router creation
export { createRouter } from "./router/router";

// Config
export { defineConfig } from "./config";
export type { FossylConfig, ValidationOptions, AdaptersConfig } from "./config";

// Adapter types
export type {
  FrameworkAdapter,
  DatabaseAdapter,
  ValidationAdapter,
  GeneratorContext,
  DevServer,
  DevServerOptions,
  RouteInfo,
  HttpMethod,
} from "./adapters";

// Route types
export type {
  Authentication,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  RestMethod,
  Route,
} from "./router/types/routes.types";

export type {
  ValidatorFunction,
  AuthenticationFunction,
} from "./router/types/configuration.types";

export type { Endpoint, Router } from "./router/types/router-creation.types";

export type { Params } from "./router/types/params.types";

// Validation types
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./validation";

// Utility exports
export { authWrapper } from "./router/types/routes.types";
