import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getSessionFromHeaders } from "@/lib/session";

type PlanRequestBody = {
  name?: string;
};

export async function POST(request: Request) {
  const session = await getSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as PlanRequestBody;
  const name = body.name?.trim() || "New plan";

  const { db } = await import("@/lib/db");
  const { workoutPlans } = await import("@/lib/db/schema");

  const [plan] = await db
    .insert(workoutPlans)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      name,
      isActive: true,
    })
    .returning();

  return NextResponse.json({ plan });
}
