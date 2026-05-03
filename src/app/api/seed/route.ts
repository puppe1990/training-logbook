import { NextResponse } from "next/server";

import { seedStarterPlan } from "@/lib/db/seed";

export async function POST() {
  const result = await seedStarterPlan();
  return NextResponse.json({ ok: true, planId: result.planId });
}
