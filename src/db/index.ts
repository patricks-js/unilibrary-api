import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "../lib/env";
import * as auth from "./schema/auth";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    max: 10,
    idleTimeout: 30,
  },
  schema: {
    ...auth,
  },
  casing: "snake_case",
});
