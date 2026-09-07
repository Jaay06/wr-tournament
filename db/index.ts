import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
// HTTP queries do not retain request-owned WebSockets in the shared Worker.
neonConfig.poolQueryViaFetch = true;

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

// Interactive transactions still need WebSockets. Own and close their pool
// inside the operation so no later request can borrow one of its connections.
db.transaction = async (transaction, config) => {
  const transactionPool = new Pool({ connectionString: databaseUrl });

  try {
    return await drizzle({ client: transactionPool }).transaction(transaction, config);
  } finally {
    await transactionPool.end();
  }
};
