import { NextResponse } from "next/server";

import { searchExerciseImage } from "@/lib/images/wikimedia";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Missing exercise query" },
      { status: 400 },
    );
  }

  const result = await searchExerciseImage(query);
  return NextResponse.json(result);
}
