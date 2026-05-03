import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { sessionEntries } from "@/lib/db/schema";
import { normalizeEntryPayload } from "@/lib/workouts/save-session-entry";

type SessionEntryRequestBody = {
  workoutSessionId?: string;
  exerciseId?: string;
  setNumber?: string;
  performedReps?: string;
  weightValue?: string;
  targetRepsMin?: number | string | null;
  targetRepsMax?: number | string | null;
  note?: string | null;
  isCompleted?: boolean;
  dayExerciseId?: string | null;
};

export async function POST(request: Request) {
  const { db } = await import("@/lib/db");
  const body = (await request.json()) as SessionEntryRequestBody;

  if (!body.workoutSessionId || !body.exerciseId || !body.setNumber) {
    return NextResponse.json(
      { error: "Missing session entry identifiers" },
      { status: 400 },
    );
  }

  const normalized = normalizeEntryPayload({
    setNumber: body.setNumber,
    performedReps: body.performedReps ?? "",
    weightValue: body.weightValue ?? "",
  });

  const existingEntry = await db
    .select()
    .from(sessionEntries)
    .where(
      and(
        eq(sessionEntries.workoutSessionId, body.workoutSessionId),
        eq(sessionEntries.exerciseId, body.exerciseId),
        eq(sessionEntries.setNumber, normalized.setNumber),
      ),
    )
    .limit(1);

  const data = {
    workoutSessionId: body.workoutSessionId,
    exerciseId: body.exerciseId,
    setNumber: normalized.setNumber,
    performedReps: normalized.performedReps,
    weightValue: normalized.weightValue,
    targetRepsMin:
      body.targetRepsMin === null || body.targetRepsMin === undefined
        ? null
        : Number(body.targetRepsMin),
    targetRepsMax:
      body.targetRepsMax === null || body.targetRepsMax === undefined
        ? null
        : Number(body.targetRepsMax),
    note: body.note ?? null,
    isCompleted: body.isCompleted ?? false,
    dayExerciseId: body.dayExerciseId ?? null,
  };

  if (existingEntry[0]) {
    const [updatedEntry] = await db
      .update(sessionEntries)
      .set(data)
      .where(eq(sessionEntries.id, existingEntry[0].id))
      .returning();

    return NextResponse.json({ entry: updatedEntry });
  }

  const [createdEntry] = await db
    .insert(sessionEntries)
    .values({
      id: randomUUID(),
      ...data,
    })
    .returning();

  return NextResponse.json({ entry: createdEntry });
}
