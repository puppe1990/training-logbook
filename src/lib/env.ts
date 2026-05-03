export type RawEnv = Record<string, string | undefined>;

export type AppEnv = {
  tursoUrl: string;
  tursoAuthToken: string;
  authSecret: string;
  authUrl: string;
};

export type DatabaseEnv = Pick<AppEnv, "tursoUrl" | "tursoAuthToken">;

export type AuthEnv = Pick<AppEnv, "authSecret" | "authUrl">;

function requireValue(value: string | undefined): string {
  if (!value) {
    throw new Error("Missing required environment variables");
  }

  return value;
}

export function readDatabaseEnv(raw: RawEnv = process.env): DatabaseEnv {
  const tursoUrl = requireValue(raw.TURSO_DATABASE_URL);
  const tursoAuthToken = requireValue(raw.TURSO_AUTH_TOKEN);

  return {
    tursoUrl,
    tursoAuthToken,
  };
}

export function readAuthEnv(raw: RawEnv = process.env): AuthEnv {
  const authSecret = requireValue(raw.BETTER_AUTH_SECRET);
  const authUrl = requireValue(raw.BETTER_AUTH_URL);

  return {
    authSecret,
    authUrl,
  };
}

export function readEnv(raw: RawEnv = process.env): AppEnv {
  return {
    ...readDatabaseEnv(raw),
    ...readAuthEnv(raw),
  };
}
