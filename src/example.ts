import { createRouter } from "./router/router";
import { authWrapper } from "./router/types/routes.types";

const authenticationMiddleware = async (
  headers: Record<string, string>
) => {
  return authWrapper({
    status: headers.authorization,
  });
}

const baseRouter = createRouter("/status");
const baseEndpoint = baseRouter.createEndpoint("/status").get({
  path: "/status",
  type: "authenticated",
  authenticator: authenticationMiddleware,
  handler: async (params, auth) => {
    return {
      status: "ok",
    };
  },
});


