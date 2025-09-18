import { db } from "../../database/db";

export function createContext({
  req,
  resHeaders,
  db: dbInstance,
}: {
  req: Request;
  resHeaders: Headers;
  db: typeof db;
}) {
  return {
    db: dbInstance,
    req,
    resHeaders,
  };
}

export type Context = ReturnType<typeof createContext>;