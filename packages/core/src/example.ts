import { createRouter } from "./router/router";
import { authWrapper } from "./router/types/routes.types";

const authenticationMiddleware = async (headers: Record<string, string>) => {
  // Simulate async auth (e.g., OAuth, database lookup, JWT verification)
  return authWrapper({
    status: headers.authorization,
  });
};

const baseRouter = createRouter("/status");
const endpoint = baseRouter.createEndpoint("/status");

const _getter = endpoint.get({
  authenticator: authenticationMiddleware,
  handler: async (_params, _auth) => {
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});

const _poster = endpoint.post({
  validator: (): { a: string } => ({ a: "hello" }),
  queryValidator: (): { b: string } => ({ b: "OKAY" }),
  handler: async (_params, _body) => {
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});
