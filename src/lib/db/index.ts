import { drizzle } from "drizzle-orm/libsql";

import { tursoClient } from "@/lib/db/client";

export const db = drizzle(tursoClient);
