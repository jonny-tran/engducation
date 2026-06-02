import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// Set WebSocket constructor for Node.js environments
neonConfig.webSocketConstructor = ws;

import * as schema from "./schema";

export function createDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool, { schema });
}

export const db = createDb();
