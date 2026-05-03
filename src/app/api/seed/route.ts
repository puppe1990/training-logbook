import { NextResponse } from "next/server";

import { getSessionFromHeaders } from "@/lib/session";
import { seedStarterPlan } from "@/lib/db/seed";

export async function POST(request: Request) {
  const session = await getSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await seedStarterPlan();
  return NextResponse.json({ ok: true, planId: result.planId });
}
