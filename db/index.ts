import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let db: any = null;

export async function initDb() {
  if (db) return db;
  try {
    // Dynamic import to prevent Node.js linking errors during local test runs
    const { env } = await import("cloudflare:workers");
    if (!env.DB) {
      throw new Error("Cloudflare D1 binding `DB` is unavailable.");
    }
    db = drizzle(env.DB, { schema });
  } catch (err) {
    // If running in local Node.js test environment, use a mock db
    if (typeof process !== "undefined" && (process.env.NODE_ENV === "test" || process.env.NODE_TEST_CONTEXT)) {
      db = {
        select: () => ({
          from: () => ({
            where: () => ({
              get: async () => null,
            }),
          }),
        }),
        insert: () => ({
          values: async () => [{}],
        }),
      };
    } else {
      throw err;
    }
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Please ensure initDb() is called and awaited first.");
  }
  return db;
}
