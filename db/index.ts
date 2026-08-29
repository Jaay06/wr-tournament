import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Add your Neon connection string to .env.local.",
  );
}

const globalForNeon = globalThis as unknown as {
  neonPool?: Pool;
};

export const pool =
  globalForNeon.neonPool ?? new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForNeon.neonPool = pool;
}

export const db = drizzle({ client: pool });
