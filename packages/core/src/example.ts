import { createRouter } from "./router/router";
import { authWrapper } from "./router/types/routes.types";

const authenticationMiddleware = (headers: Record<string, string>) => {
  return authWrapper({
    status: headers.authorization,
  });
};

const baseRouter = createRouter("/status");
const endpoint = baseRouter.createEndpoint("/status");

const getter = endpoint.get({
  authenticator: authenticationMiddleware,
  handler: async (params, auth) => {
    return {
      status: "ok",
    };
  },
});

const poster = endpoint.post({
  validator: (): { a: string } => ({ a: "hello" }),
  queryValidator: (): {b: string} => ({b: "OKAY"}),
  handler: async (params, body) => {
    return {
      status: "ok",
    };
  },
});

