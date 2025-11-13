import { GetEndpointCreationFunction } from "./configuration.types";
import { EndpointCreationFunction } from "./configuration.types";

/* Endpoint seems more complex than it is from its type signature.
 * It has 4 Major functions on offer. The different HTTP methods
 *
 * These use the EndpointCreationFunction
 */
export type Endpoint<Path extends string> = {
  get: GetEndpointCreationFunction<Path, "GET">;
  post: EndpointCreationFunction<Path, "POST">;
  put: EndpointCreationFunction<Path, "PUT">;
  delete: GetEndpointCreationFunction<Path, "DELETE">;
};

/**
 * Creates a router that ensures all endpoints extend the route.
 * IDK if this is actually useful, but I kinda like it.
 *
 * There def was a part of me that thought about pure generator functions.
 * In fact... they're provided!
 *
 * We can discuss that.
 */
export type Router<BasePath extends string> = {
  /**
   * Creates an endpoint
   * @param path string, must extend Router's string
   */
  createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) => Endpoint<Path>;
  /**
   * Creates a subrouter
   * @param path string, must extend Router's string
   */
  createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) => Router<Path>;
};
