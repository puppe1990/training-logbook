import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionFromHeaders } from "@/lib/session";
import {
  dayExercises,
  sessionEntries,
  workoutDays,
  workoutPlans,
  workoutSessions,
} from "@/lib/db/schema";
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

type ExistingSessionEntryLookupResult =
  | { status: "found"; entry: { id: string; dayExerciseId: string | null } }
  | { status: "missing" }
  | { status: "ambiguous" };

async function findExistingSessionEntry(input: {
  db: {
    select: typeof import("@/lib/db").db.select;
  };
  workoutSessionId: string;
  exerciseId: string;
  setNumber: number;
  dayExerciseId: string | null;
}): Promise<ExistingSessionEntryLookupResult> {
  const baseFilter = and(
    eq(sessionEntries.workoutSessionId, input.workoutSessionId),
    eq(sessionEntries.setNumber, input.setNumber),
  );

  if (!input.dayExerciseId) {
    const matchingEntries = await input.db
      .select()
      .from(sessionEntries)
      .where(and(baseFilter, eq(sessionEntries.exerciseId, input.exerciseId)))
      .limit(2);

    if (matchingEntries.length === 1) {
      return { status: "found", entry: matchingEntries[0] };
    }

    if (matchingEntries.length > 1) {
      return { status: "ambiguous" };
    }

    return { status: "missing" };
  }

  const existingSlotEntry = await input.db
    .select()
    .from(sessionEntries)
    .where(
      and(baseFilter, eq(sessionEntries.dayExerciseId, input.dayExerciseId)),
    )
    .limit(1);

  if (existingSlotEntry[0]) {
    return { status: "found", entry: existingSlotEntry[0] };
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

  if (legacyEntry[0]) {
    return { status: "found", entry: legacyEntry[0] };
  }

  return { status: "missing" };
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function resolveWorkoutSessionId(input: {
  db: typeof import("@/lib/db").db;
  userId: string;
  workoutSessionId?: string;
  workoutDayId?: string;
}) {
  if (input.workoutSessionId) {
    const [existingSession] = await input.db
      .select({
        id: workoutSessions.id,
        workoutDayId: workoutSessions.workoutDayId,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.id, input.workoutSessionId),
          eq(workoutSessions.userId, input.userId),
        ),
      )
      .limit(1);

    if (!existingSession) {
      throw new Error("Missing session entry identifiers");
    }

    if (
      input.workoutDayId &&
      existingSession.workoutDayId &&
      existingSession.workoutDayId !== input.workoutDayId
    ) {
      throw new Error("Missing session entry identifiers");
    }

    return existingSession.id;
  }

  if (!input.workoutDayId) {
    throw new Error("Missing session entry identifiers");
  }

  const performedOn = formatDateString(new Date());
  const [existingSession] = await input.db
    .select({
      id: workoutSessions.id,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, input.userId),
        eq(workoutSessions.workoutDayId, input.workoutDayId),
        eq(workoutSessions.performedOn, performedOn),
      ),
    )
    .limit(1);

  if (existingSession) {
    return existingSession.id;
  }

  const [createdSession] = await input.db
    .insert(workoutSessions)
    .values({
      id: randomUUID(),
      userId: input.userId,
      workoutDayId: input.workoutDayId,
      performedOn,
    })
    .returning();

  return createdSession.id;
}

async function resolveOwnedDayExercise(input: {
  db: typeof import("@/lib/db").db;
  userId: string;
  dayExerciseId: string;
}) {
  const [dayExercise] = await input.db
    .select({
      id: dayExercises.id,
      exerciseId: dayExercises.exerciseId,
      workoutDayId: dayExercises.workoutDayId,
    })
    .from(dayExercises)
    .innerJoin(workoutDays, eq(workoutDays.id, dayExercises.workoutDayId))
    .innerJoin(workoutPlans, eq(workoutPlans.id, workoutDays.planId))
    .where(
      and(
        eq(dayExercises.id, input.dayExerciseId),
        eq(workoutPlans.userId, input.userId),
      ),
    )
    .limit(1);

  return dayExercise ?? null;
}

export async function POST(request: Request) {
  const session = await getSessionFromHeaders(request.headers);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@/lib/db");
  let body: SessionEntryRequestBody;

  try {
    const bodyText = await request.text();
    body = bodyText ? (JSON.parse(bodyText) as SessionEntryRequestBody) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid session entry payload" },
      { status: 400 },
    );
  }

  if (!body.exerciseId || !body.setNumber) {
    return NextResponse.json(
      { error: "Missing session entry identifiers" },
      { status: 400 },
    );
  }

  let normalized: ReturnType<typeof normalizeEntryPayload>;

  try {
    normalized = normalizeEntryPayload({
      setNumber: body.setNumber,
      performedReps: body.performedReps ?? "",
      weightValue: body.weightValue ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid session entry payload" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(normalized.setNumber) || normalized.setNumber < 1) {
    return NextResponse.json(
      { error: "Invalid session entry payload" },
      { status: 400 },
    );
  }

  let workoutSessionId: string;
  const resolvedDayExercise = body.dayExerciseId
    ? await resolveOwnedDayExercise({
        db,
        userId: session.user.id,
        dayExerciseId: body.dayExerciseId,
      })
    : null;

  if (body.dayExerciseId && !resolvedDayExercise) {
    return NextResponse.json(
      { error: "Missing session entry identifiers" },
      { status: 400 },
    );
  }

  if (
    resolvedDayExercise &&
    resolvedDayExercise.exerciseId !== body.exerciseId
  ) {
    return NextResponse.json(
      { error: "Missing session entry identifiers" },
      { status: 400 },
    );
  }

  try {
    workoutSessionId = await resolveWorkoutSessionId({
      db,
      userId: session.user.id,
      workoutSessionId: body.workoutSessionId,
      workoutDayId: resolvedDayExercise?.workoutDayId,
    });
  } catch {
    return NextResponse.json(
      { error: "Missing session entry identifiers" },
      { status: 400 },
    );
  }

  const existingEntry = await findExistingSessionEntry({
    db,
    workoutSessionId,
    exerciseId: body.exerciseId,
    setNumber: normalized.setNumber,
    dayExerciseId: body.dayExerciseId ?? null,
  });

  if (existingEntry.status === "ambiguous") {
    return NextResponse.json(
      { error: "Ambiguous session entry identifiers" },
      { status: 409 },
    );
  }

  const data = {
    workoutSessionId,
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
    dayExerciseId:
      body.dayExerciseId ??
      (existingEntry.status === "found"
        ? existingEntry.entry.dayExerciseId
        : null),
  };

  if (existingEntry.status === "found") {
    const [updatedEntry] = await db
      .update(sessionEntries)
      .set(data)
      .where(eq(sessionEntries.id, existingEntry.entry.id))
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
