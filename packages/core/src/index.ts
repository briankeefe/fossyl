// Router creation
export { createRouter } from "./router/router";

// Type exports
export type {
  Authentication,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  RestMethod,
} from "./router/types/routes.types";

export type {
  ValidatorFunction,
  AuthenticationFunction,
} from "./router/types/configuration.types";

export type { Endpoint, Router } from "./router/types/router-creation.types";

// Utility exports
export { authWrapper } from "./router/types/routes.types";
