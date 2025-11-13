import { AuthenticationFunction, ValidatorFunction } from "./configuration.types";
import { Params } from "./params.types";

declare const authBrand: unique symbol;
export type Authentication = { readonly [authBrand]: "Auth" };
export function authWrapper<T>(auth: T): T & Authentication {
  return {
    ...auth,
    [authBrand]: "Auth",
  };
}

export type RestMethod = "GET" | "POST" | "PUT" | "DELETE";

// Combined Route
export type BaseRoute<Path extends string> = {
  TRANSACTIONS: boolean;
  path: Path;
  logging?: (input: any) => void;
};

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

export type Route<
  Path extends string,
  Res extends unknown,
  Method extends RestMethod,
  RequestBody extends unknown | undefined = undefined,
  Auth extends Authentication | undefined = undefined,
  Query extends unknown | undefined = undefined,
> = [RequestBody, Auth] extends [undefined, undefined]
  ? OpenRoute<Path, Method, Res, Query>
  : [RequestBody, Auth] extends [undefined, infer A extends Authentication]
    ? AuthenticatedRoute<Path, Method, Res, A, Query>
    : [RequestBody, Auth] extends [infer B, undefined]
      ? ValidatedRoute<Path, Method, Res, B, Query>
      : [RequestBody, Auth] extends [infer B, infer A extends Authentication]
        ? FullRoute<Path, Method, Res, B, A, Query>
        : never;
