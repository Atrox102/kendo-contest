import { createMiddleware } from "hono/factory";
import { db } from "../database/db";

declare module "hono" {
  interface Variables {
    db: typeof db;
  }
}

export const dbHonoMiddleware = createMiddleware(async (c, next) => {
  c.set("db", db);
  await next();
});