import {
  Auth,
  AuthenticatedRoute,
  FullRoute,
  OpenRoute,
  ValidatedRoute,
} from "./routes.types";
import { ZodType } from "zod";
import { RestMethod } from "./routes.types";

export type Validator<T> = (data: unknown) => T | Promise<T>

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
export type EndpointCreationFunction<
  Path extends string,
  Method extends RestMethod
> = {
  <
    Res extends object,
    Validator extends ZodType,
    Query extends object | undefined = undefined
  >(
    config: ValidatedRoute<Path, Method, Res, Validator, Query>
  ): ValidatedRoute<Path, Method, Res, Validator, Query>;

  <
    Res extends object,
    Validator extends ZodType,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    config: FullRoute<Path, Method, Res, Validator, Authentication, Query>
  ): FullRoute<Path, Method, Res, Validator, Authentication, Query>;
};

/**
 * This is the same as the EndpointCreationFunction, but it does not allow a vlaidator, and thus no body.
 */
export type GetEndpointCreationFunction<
  Path extends string,
  Method extends RestMethod
> = {
  <Res extends object, Query extends object | undefined = undefined>(
    config: Omit<OpenRoute<Path, Method, Res, Query>, "method">
  ): OpenRoute<Path, Method, Res, Query>;

  <
    Res extends object,
    Authentication extends Auth,
    Query extends object | undefined = undefined
  >(
    config: Omit<
      AuthenticatedRoute<Path, Method, Res, Authentication, Query>,
      "method"
    >
  ): AuthenticatedRoute<Path, Method, Res, Authentication, Query>;
};
