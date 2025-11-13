import { Params } from "./params.types";
import {
  Authentication,
  AuthenticatedRoute,
  FullRoute,
  OpenRoute,
  ValidatedRoute,
} from "./routes.types";
import { RestMethod } from "./routes.types";

export type ValidatorFunction<T extends unknown = unknown> = (data: unknown) => T;
export type AuthenticationFunction<T extends Authentication> = (
  headers: Record<string, string>
) => T;

/**
 * This is the most confusing part of the type system, but also key.
 * This type is used to force type inferenece when creating your endpoints.
 * This is the structure to provide `function overload`s. This is so you can have the same function
 * (in our case get,put,post,delete) but allow differnt configurations.
 *
 * These configurations need to be strongly typed force the developers into using the tools.
 *
 * Want to allow Auth? - Gotta pass in authenticator and the type system handles it
 *
 * Also, this is where the core of the Zod system is. We force the body to be a zod validated input.
 * Luckily, this is pretty easy to replace.
 * PART of me wanted to further abstract it such that you needed a translation function but
 * that seemed overengineerd
 *
 */

/**
 * Configuration type for POST/PUT/DELETE endpoints.
 * These methods require a request body, so they always need a validator.
 *
 * Four variants (with/without auth × with/without query):
 * 1. Validated only, no query: validator + handler(params, body)
 * 2. Validated only, with query: validator + queryValidator + handler(params, body)
 * 3. Full (auth + validated), no query: authenticator + validator + handler(params, auth, body)
 * 4. Full (auth + validated), with query: authenticator + validator + queryValidator + handler(params, auth, body)
 */
export type EndpointCreationFunction<Path extends string, Method extends RestMethod> = {
  // Validated route: no auth, no query
  <Res extends unknown, RequestBody extends unknown>(
    config: {
      authenticator?: never;
      validator: ValidatorFunction<RequestBody>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, body: RequestBody) => Promise<Res>;
    }
  ): ValidatedRoute<Path, Method, Res, RequestBody, undefined>;

  // Validated route: no auth, with query
  <Res extends unknown, RequestBody extends unknown, Query extends unknown>(
    config: {
      authenticator?: never;
      validator: ValidatorFunction<RequestBody>;
      queryValidator: ValidatorFunction<Query>;
      handler: (
        params: { url: Params<Path>; query: Query },
        body: RequestBody
      ) => Promise<Res>;
    }
  ): ValidatedRoute<Path, Method, Res, RequestBody, Query>;

  // Full route: auth + body validation, no query
  <Res extends unknown, RequestBody extends unknown, Auth extends Authentication>(
    config: {
      authenticator: AuthenticationFunction<Auth>;
      validator: ValidatorFunction<RequestBody>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Res>;
    }
  ): FullRoute<Path, Method, Res, RequestBody, Auth, undefined>;

  // Full route: auth + body validation, with query
  <
    Res extends unknown,
    RequestBody extends unknown,
    Auth extends Authentication,
    Query extends unknown,
  >(
    config: {
      authenticator: AuthenticationFunction<Auth>;
      validator: ValidatorFunction<RequestBody>;
      queryValidator: ValidatorFunction<Query>;
      handler: (
        params: { url: Params<Path>; query: Query },
        auth: Auth,
        body: RequestBody
      ) => Promise<Res>;
    }
  ): FullRoute<Path, Method, Res, RequestBody, Auth, Query>;
};

/**
 * Configuration type for GET/DELETE endpoints.
 * These methods cannot have a request body, so no validator.
 *
 * Four variants (with/without auth × with/without query):
 * 1. Open, no query: just handler(params)
 * 2. Open, with query: queryValidator + handler(params)
 * 3. Authenticated, no query: authenticator + handler(params, auth)
 * 4. Authenticated, with query: authenticator + queryValidator + handler(params, auth)
 */
export type GetEndpointCreationFunction<Path extends string, Method extends RestMethod> = {
  // Open route: no auth, no query
  <Res extends unknown>(
    config: {
      authenticator?: never;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }) => Promise<Res>;
    }
  ): OpenRoute<Path, Method, Res, undefined>;

  // Open route: no auth, with query
  <Res extends unknown, Query extends unknown>(
    config: {
      authenticator?: never;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
    }
  ): OpenRoute<Path, Method, Res, Query>;

  // Authenticated route: auth, no query
  <Res extends unknown, Auth extends Authentication>(
    config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, auth: Auth) => Promise<Res>;
    }
  ): AuthenticatedRoute<Path, Method, Res, Auth, undefined>;

  // Authenticated route: auth, with query
  <Res extends unknown, Auth extends Authentication, Query extends unknown>(
    config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: { url: Params<Path>; query: Query }, auth: Auth) => Promise<Res>;
    }
  ): AuthenticatedRoute<Path, Method, Res, Auth, Query>;
};
