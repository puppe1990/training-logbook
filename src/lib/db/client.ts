import { createClient } from "@libsql/client";

import { readDatabaseEnv } from "@/lib/env";

const env = readDatabaseEnv();

export const tursoClient = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken,
});
