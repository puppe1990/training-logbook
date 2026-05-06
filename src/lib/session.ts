import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

export async function getSessionFromHeaders(requestHeaders: Headers) {
  return auth.api.getSession({
    headers: requestHeaders,
  });
}

export const getSession = cache(async () =>
  getSessionFromHeaders(await headers()),
);

export async function requireSession(redirectTo = "/") {
  const session = await getSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}
