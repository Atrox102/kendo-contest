import { createMiddleware } from "hono/factory";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../backend/trpc/router";
import type { Context } from "hono";

export const trpcHonoMiddleware = createMiddleware(async (c, next) => {
  if (c.req.path.startsWith("/api/trpc")) {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext: ({ req, resHeaders }) => {
        return {
          db: c.get("db"),
          req,
          resHeaders,
        };
      },
    });
    return response;
  }
  await next();
});