import { AuthenticationFunction, ValidatorFunction } from "./configuration.types";
import { Params } from "./params.types";

declare const authBrand: unique symbol;
declare const requestBrand: unique symbol;
/**
 * Brand type for authenticated user data.
 *
 * All authentication data returned from authenticator functions must be branded
 * with this type to ensure proper type inference in route handlers.
 *
 * Used internally - you typically won't reference this type directly.
 * Use authWrapper() in your authenticator functions to apply the brand.
 *
 * Search for this type in your codebase to find all authentication implementations.
 */
export type Authentication = { readonly [authBrand]: "Auth" };

/**
 * Brand type for validated request bodies.
 *
 * All request bodies passed through validator functions should be branded
 * with this type to track which data has been validated.
 *
 * Used internally - you typically won't reference this type directly.
 * Use bodyWrapper() in your validator functions to apply the brand.
 *
 * Search for this type in your codebase to find all request body validators.
 */
export type RequestBody = { readonly [requestBrand]: "RequestBody" };

/**
 * Wraps authentication data with proper branding for type inference.
 *
 * Use this in your authenticator function's return value to ensure
 * the auth object is properly typed throughout the route handler.
 *
 * @example
 * const authenticator = async (headers: Record<string, string>) => {
 *   return authWrapper({
 *     userId: headers['x-user-id'],
 *     role: headers['x-user-role']
 *   });
 * };
 */
export function authWrapper<T>(auth: T): T & Authentication {
  return {
    ...auth,
    [authBrand]: "Auth",
  };
}

/**
 * Wraps request body data with proper branding for type inference.
 *
 * Use this in your validator function's return value to ensure
 * the body object is properly typed throughout the route handler.
 *
 * @example
 * const validator = (data: unknown): { name: string; email: string } & RequestBody => {
 *   // Your validation logic here (can use Zod, Yup, etc.)
 *   return bodyWrapper({
 *     name: String(data.name),
 *     email: String(data.email)
 *   });
 * };
 */
export function bodyWrapper<T>(body: T): T & RequestBody {
  return {
    ...body,
    [requestBrand]: "RequestBody",
  };
}

export type RestMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Open routes are completely open - no authentication or validation required.
 *
 * Handler receives: (params: { url, query })
 *
 * These need no Authentication, no Body Validation, but may have a Query.
 *
 * In practice you're unlikely to use this with POST or PUT,
 * but there are times it can be useful like triggering a status update.
 *
 * It's also likely unwise to use this with DELETE, but that's a dealer's choice.
 */
export type OpenRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends unknown,
  Query extends unknown | undefined = undefined,
> = {
  type: "open";
  path: Path;
  method: Method;
  validator?: never;
  authenticator?: never;
  handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
};

/**
 * Authenticated routes require an authenticated user to call.
 *
 * Handler receives: (params: { url, query }, auth)
 *
 * Authentication functions are async functions that return an Authentication promise.
 * This Authentication is then usable inside the Handler.
 *
 * These routes need no Body Validation, but may have a Query.
 *
 * In practice these will be routes for your logged in users, or external applications that can
 * validate their security with your application.
 */
export type AuthenticatedRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends unknown,
  Auth extends Authentication,
  Query extends unknown | undefined = undefined,
> = {
  type: "authenticated";
  path: Path;
  method: Method;
  validator?: never;
  authenticator: AuthenticationFunction<Auth>;
  handler: (
    params: {
      url: Params<Path>;
      query: Query;
    },
    auth: Auth
  ) => Promise<Res>;
};

/**
 * Validated routes require a validated body to be called.
 *
 * Handler receives: (params: { url, query }, body)
 *
 * Validation functions are synchronous functions that return a RequestBody.
 * This RequestBody is then usable inside the Handler.
 *
 * These routes need no Authentication, but may have a Query.
 *
 * In practice these will be routes for non-logged in users, or unauthenticated external applications.
 * Something like a third party app that needs to get a token from your system.
 */
export type ValidatedRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends unknown,
  RequestBody extends unknown,
  Query extends unknown | undefined = undefined,
> = {
  type: "validated";
  path: Path;
  method: Method;
  validator: ValidatorFunction<RequestBody>;
  authenticator?: never;
  handler: (
    params: {
      url: Params<Path>;
      query: Query;
    },
    body: RequestBody
  ) => Promise<Res>;
};

/**
 * Full routes require a validated body and an authenticated user to call.
 *
 * Handler receives: (params: { url, query }, auth, body)
 *
 * Validation functions are synchronous functions that return a RequestBody.
 * This RequestBody is then usable inside the Handler.
 *
 * Authentication functions are async functions that return an Authentication promise.
 * This Authentication is then usable inside the Handler.
 *
 * These may have a Query.
 *
 * In practice these will be routes for logged in users, or authenticated external applications,
 * that also need to send a request body. This is likely the most common route type for POST and PUT routes.
 */
export type FullRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends unknown,
  RequestBody extends unknown,
  Auth extends Authentication,
  Query extends unknown | undefined = undefined,
> = {
  type: "full";
  path: Path;
  method: Method;
  validator: ValidatorFunction<RequestBody>;
  authenticator: AuthenticationFunction<Auth>;
  handler: Query extends undefined
    ? (
        params: {
          url: Params<Path>;
        },
        auth: Authentication,
        body: RequestBody
      ) => Promise<Res>
    : (
        params: {
          url: Params<Path>;
          query: Query;
        },
        auth: Authentication,
        body: RequestBody
      ) => Promise<Res>;
};

/**
 * Union of all route types.
 * Used by adapters and CLI for route processing.
 */
export type Route =
  | OpenRoute<string, RestMethod, unknown, unknown>
  | AuthenticatedRoute<string, RestMethod, unknown, Authentication, unknown>
  | ValidatedRoute<string, RestMethod, unknown, unknown, unknown>
  | FullRoute<string, RestMethod, unknown, unknown, Authentication, unknown>;
