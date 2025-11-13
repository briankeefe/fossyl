import {
  Authentication,
  FullRoute,
  ValidatedRoute,
  AuthenticatedRoute,
  OpenRoute,
} from "./types/routes.types";
import { Endpoint, Router } from "./types/router-creation.types";
import { AuthenticationFunction, ValidatorFunction } from "./types/configuration.types";
import { Params } from "./types/params.types";

/**
 * Creates an endpoint which can be used to create final routes from.
 * Routes must be fully qualified. This is provided as a helper function
 * @param path
 */

// Function overloads in TypeScript are only allowed for functions, not for object properties.
// When you try to declare multiple properties with the same name (like `get`) in an object literal,
// you get a syntax error: "An object literal cannot have multiple properties with the same name."
// Additionally, the type signatures for overloaded methods must be declared as overloads on a function, not as separate properties.
// The correct way is to define a single function for `get` that matches the overload signatures, and then assign it as the property.
//

function createEndpoint<Path extends string>(path: Path): Endpoint<Path> {
  // Open route: no auth, no query
  function get<Res extends unknown>(config: {
    authenticator?: never;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }) => Promise<Res>;
  }): OpenRoute<Path, "GET", Res, undefined>;

  // Open route: no auth, with query
  function get<Res extends unknown, Query extends unknown>(config: {
    authenticator?: never;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
  }): OpenRoute<Path, "GET", Res, Query>;

  // Authenticated route: auth, no query
  function get<Res extends unknown, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, "GET", Res, Auth, undefined>;

  // Authenticated route: auth, with query
  function get<Res extends unknown, Auth extends Authentication, Query extends unknown>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, "GET", Res, Auth, Query>;

  function get(
    config:
      | { handler: (params: { url: Params<Path> }) => Promise<any> }
      | { queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; handler: (params: { url: Params<Path> }, auth: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, auth: any) => Promise<any> }
  ): OpenRoute<Path, "GET", any, any> | AuthenticatedRoute<Path, "GET", any, any, any> {
    if ("authenticator" in config) {
      return { ...config, type: "authenticated", path, method: "GET" } satisfies AuthenticatedRoute<
        Path,
        "GET",
        any,
        any,
        any
      >;
    } else {
      return { ...config, type: "open", path, method: "GET" } satisfies OpenRoute<
        Path,
        "GET",
        any,
        any
      >;
    }
  }

  // Validated route: no auth, no query
  function put<Res extends unknown, RequestBody extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, "PUT", Res, RequestBody, undefined>;

  // Validated route: no auth, with query
  function put<Res extends unknown, RequestBody extends unknown, Query extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, "PUT", Res, RequestBody, Query>;

  // Full route: auth + body validation, no query
  function put<Res extends unknown, RequestBody extends unknown, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Res>;
  }): FullRoute<Path, "PUT", Res, RequestBody, Auth, undefined>;

  // Full route: auth + body validation, with query
  function put<
    Res extends unknown,
    RequestBody extends unknown,
    Auth extends Authentication,
    Query extends unknown,
  >(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, auth: Auth, body: RequestBody) => Promise<Res>;
  }): FullRoute<Path, "PUT", Res, RequestBody, Auth, Query>;

  function put(
    config:
      | { validator: ValidatorFunction<any>; handler: (params: { url: Params<Path> }, body: any) => Promise<any> }
      | { validator: ValidatorFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, body: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; validator: ValidatorFunction<any>; handler: (params: { url: Params<Path> }, auth: any, body: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; validator: ValidatorFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, auth: any, body: any) => Promise<any> }
  ): ValidatedRoute<Path, "PUT", any, any, any> | FullRoute<Path, "PUT", any, any, any, any> {
    if ("authenticator" in config) {
      return { ...config, type: "full", path, method: "PUT" } satisfies FullRoute<
        Path,
        "PUT",
        any,
        any,
        any,
        any
      >;
    } else {
      return { ...config, type: "validated", path, method: "PUT" } satisfies ValidatedRoute<
        Path,
        "PUT",
        any,
        any,
        any
      >;
    }
  }

  // Validated route: no auth, no query
  function post<Res extends unknown, RequestBody extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, "POST", Res, RequestBody, undefined>;

  // Validated route: no auth, with query
  function post<Res extends unknown, RequestBody extends unknown, Query extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, "POST", Res, RequestBody, Query>;

  // Full route: auth + body validation, no query
  function post<Res extends unknown, RequestBody extends unknown, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Res>;
  }): FullRoute<Path, "POST", Res, RequestBody, Auth, undefined>;

  // Full route: auth + body validation, with query
  function post<
    Res extends unknown,
    RequestBody extends unknown,
    Auth extends Authentication,
    Query extends unknown,
  >(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, auth: Auth, body: RequestBody) => Promise<Res>;
  }): FullRoute<Path, "POST", Res, RequestBody, Auth, Query>;

  function post(
    config:
      | { validator: ValidatorFunction<any>; handler: (params: { url: Params<Path> }, body: any) => Promise<any> }
      | { validator: ValidatorFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, body: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; validator: ValidatorFunction<any>; handler: (params: { url: Params<Path> }, auth: any, body: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; validator: ValidatorFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, auth: any, body: any) => Promise<any> }
  ): ValidatedRoute<Path, "POST", any, any, any> | FullRoute<Path, "POST", any, any, any, any> {
    if ("authenticator" in config) {
      return { ...config, type: "full", path, method: "POST" } satisfies FullRoute<
        Path,
        "POST",
        any,
        any,
        any,
        any
      >;
    } else {
      return { ...config, type: "validated", path, method: "POST" } satisfies ValidatedRoute<
        Path,
        "POST",
        any,
        any,
        any
      >;
    }
  }

  // Open route: no auth, no query
  function del<Res extends unknown>(config: {
    authenticator?: never;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }) => Promise<Res>;
  }): OpenRoute<Path, "DELETE", Res, undefined>;

  // Open route: no auth, with query
  function del<Res extends unknown, Query extends unknown>(config: {
    authenticator?: never;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
  }): OpenRoute<Path, "DELETE", Res, Query>;

  // Authenticated route: auth, no query
  function del<Res extends unknown, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, "DELETE", Res, Auth, undefined>;

  // Authenticated route: auth, with query
  function del<Res extends unknown, Auth extends Authentication, Query extends unknown>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, "DELETE", Res, Auth, Query>;

  function del(
    config:
      | { handler: (params: { url: Params<Path> }) => Promise<any> }
      | { queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; handler: (params: { url: Params<Path> }, auth: any) => Promise<any> }
      | { authenticator: AuthenticationFunction<any>; queryValidator: ValidatorFunction<any>; handler: (params: { url: Params<Path>; query: any }, auth: any) => Promise<any> }
  ): OpenRoute<Path, "DELETE", any, any> | AuthenticatedRoute<Path, "DELETE", any, any, any> {
    if ("authenticator" in config) {
      return {
        ...config,
        type: "authenticated",
        path,
        method: "DELETE",
      } satisfies AuthenticatedRoute<Path, "DELETE", any, any, any>;
    } else {
      return { ...config, type: "open", path, method: "DELETE" } satisfies OpenRoute<
        Path,
        "DELETE",
        any,
        any
      >;
    }
  }

  return {
    get,
    post,
    put,
    delete: del,
  };
}

/**
 * Provides an Ednpoint creater. Would maybe like some other internal stuff? Lowkey... I think we
 * all might just end up using the helper functions of get and del and such.
 * @param _ - this param is still needed because the type is determined at compile time.
 */
export function createRouter<BasePath extends string>(_: BasePath): Router<BasePath> {
  return {
    createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) => createEndpoint(path),
    createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) => createRouter(path),
  };
}
