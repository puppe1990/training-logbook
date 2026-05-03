import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionFromHeaders } from "@/lib/session";
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

async function findExistingSessionEntry(input: {
  db: {
    select: typeof import("@/lib/db").db.select;
  };
  workoutSessionId: string;
  exerciseId: string;
  setNumber: number;
  dayExerciseId: string | null;
}) {
  const baseFilter = and(
    eq(sessionEntries.workoutSessionId, input.workoutSessionId),
    eq(sessionEntries.setNumber, input.setNumber),
  );

  if (input.dayExerciseId) {
    const existingSlotEntry = await input.db
      .select()
      .from(sessionEntries)
      .where(
        and(baseFilter, eq(sessionEntries.dayExerciseId, input.dayExerciseId)),
      )
      .limit(1);

    if (existingSlotEntry[0]) {
      return existingSlotEntry[0];
    }
  }

  const legacyEntry = await input.db
    .select()
    .from(sessionEntries)
    .where(
      and(
        baseFilter,
        eq(sessionEntries.exerciseId, input.exerciseId),
        isNull(sessionEntries.dayExerciseId),
      ),
    )
    .limit(1);

  return legacyEntry[0] ?? null;
}

export async function POST(request: Request) {
  const session = await getSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const existingEntry = await findExistingSessionEntry({
    db,
    workoutSessionId: body.workoutSessionId,
    exerciseId: body.exerciseId,
    setNumber: normalized.setNumber,
    dayExerciseId: body.dayExerciseId ?? null,
  });

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

  if (existingEntry) {
    const [updatedEntry] = await db
      .update(sessionEntries)
      .set(data)
      .where(eq(sessionEntries.id, existingEntry.id))
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
