import { output, ZodType } from "zod";
import {
  Auth,
  Route,
  RestMethod,
  FullRoute,
  ValidatedRoute,
  OpenRoute,
  AuthenticatedRoute,
} from "./types/routes.types";
import { Params } from "./types/params.types";
import { Endpoint, Router } from "./types/router-creation.types";
import {
  GetEndpointCreationFunction,
  EndpointCreationFunction,
} from "./types/configuration.types";

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

function createEndpoint<Path extends string>(path: Path): Endpoint<Path> {
  function get<
    Res extends object,
    Query extends object | undefined = undefined
  >(
    config: Omit<OpenRoute<Path, "GET", Res, Query>, "method">
  ): OpenRoute<Path, "GET", Res, Query>;
  function get<
    Res extends object,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    config: Omit<
      AuthenticatedRoute<Path, "GET", Res, Authentication, Query>,
      "method"
    >
  ): AuthenticatedRoute<Path, "GET", Res, Authentication, Query>;
  function get(config: unknown): any {
    if (typeof config === "object" && config !== null) {
      return { ...config, method: "GET" };
    }
    throw new Error("Invalid config");
  }

  function put<
    Res extends object,
    Validator extends ZodType,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: ValidatedRoute<Path, "PUT", Res, Validator, Query>
  ): ValidatedRoute<Path, "PUT", Res, Validator, Query>;
  function put<
    Res extends object,
    Validator extends ZodType,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: FullRoute<
      Path,
      "PUT",
      Res,
      Validator,
      Authentication,
      Query
    >
  ): FullRoute<Path, "PUT", Res, Validator, Authentication, Query>;
  function put(routeConfiguration: any) {
    return routeConfiguration;
  }

  function post<
    Res extends object,
    Validator extends ZodType,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: ValidatedRoute<Path, "POST", Res, Validator, Query>
  ): ValidatedRoute<Path, "POST", Res, Validator, Query>;
  function post<
    Res extends object,
    Validator extends ZodType,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: FullRoute<
      Path,
      "POST",
      Res,
      Validator,
      Authentication,
      Query
    >
  ): FullRoute<Path, "POST", Res, Validator, Authentication, Query>;
  function post(routeConfiguration: any) {
    return routeConfiguration;
  }

  function del<
    Res extends object,
    Validator extends ZodType,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: ValidatedRoute<Path, "DELETE", Res, Validator, Query>
  ): ValidatedRoute<Path, "DELETE", Res, Validator, Query>;

  function del<
    Res extends object,
    Validator extends ZodType,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    routeConfiguration: FullRoute<
      Path,
      "DELETE",
      Res,
      Validator,
      Authentication,
      Query
    >
  ): FullRoute<Path, "DELETE", Res, Validator, Authentication, Query>;

  function del(routeConfiguration: any) {
    return routeConfiguration;
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
export function createRouter<BasePath extends string>(
  _: BasePath
): Router<BasePath> {
  return {
    createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) =>
      createEndpoint(path),
    createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) =>
      createRouter(path),
  };
}
