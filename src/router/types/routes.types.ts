import { output, ZodType } from "zod";
import { Params } from "./params.types";

declare const authBrand: unique symbol;
export type Auth = { readonly [authBrand]: "Auth" };
export function authWrapper<T>(auth: T): T & Auth {
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
  Res extends object,
  Query extends object | undefined = undefined
> = {
  type: "open";
  path: Path;
  method: Method;
  validator?: never;
  authenticator?: never;
  handler: (params: {
    url: Params<Path>;
    query: Query;
  }) => Promise<Res>;
};

export type AuthenticatedRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends object,
  Authentication extends Auth,
  Query extends object | undefined = undefined
> = {
  type: "authenticated";
  path: Path;
  method: Method;
  validator?: never;
  authenticator: (headers: Record<string, string>) => Promise<Authentication>;
  handler: (
    params: {
      url: Params<Path>;
      query: Query;
    },
    auth: Authentication
  ) => Promise<Res>;
};

export type ValidatedRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends object,
  Validator extends ZodType,
  Query extends object | undefined = undefined
> = {
  type: "validated";
  path: Path;
  method: Method;
  validator: Validator;
  authenticator?: never;
  handler: (
    params: {
      url: Params<Path>;
      query: Query;
    },
    body: output<Validator> extends object ? output<Validator> : never
  ) => Promise<Res>;
};

export type FullRoute<
  Path extends string,
  Method extends RestMethod,
  Res extends object,
  Validator extends ZodType,
  Authentication extends Auth,
  Query extends object | undefined = undefined
> = {
  type: "full";
  path: Path;
  method: Method;
  validator: Validator;
  authenticator: (headers: Record<string, string>) => Promise<Authentication>;
  handler: Query extends undefined
    ? (
        params: {
          url: Params<Path>;
        },
        auth: Authentication,
        body: output<Validator> extends object ? output<Validator> : never
      ) => Promise<Res>
    : (
        params: {
          url: Params<Path>;
          query: Query;
        },
        auth: Authentication,
        body: output<Validator> extends object ? output<Validator> : never
      ) => Promise<Res>;
};

export type Route<
  Path extends string,
  Res extends object,
  Method extends RestMethod,
  Validator extends ZodType | undefined = undefined,
  Authentication extends Auth | undefined = undefined,
  Query extends object | undefined = undefined
> =
  | OpenRoute<Path, Method, Res>
  | ([Authentication, Validator] extends [infer A extends Auth, undefined]
      ? AuthenticatedRoute<Path, Method, Res, A, Query>
      : never)
  | ([Authentication, Validator] extends [undefined, infer B extends ZodType]
      ? ValidatedRoute<Path, Method, Res, B, Query>
      : never)
  | ([Authentication, Validator] extends [
      infer A extends Auth,
      infer B extends ZodType
    ]
      ? FullRoute<Path, Method, Res, B, A, Query>
      : never);
