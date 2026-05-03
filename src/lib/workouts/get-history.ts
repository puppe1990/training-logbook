import { desc, eq, sql } from "drizzle-orm";

import { sessionEntries, workoutDays, workoutSessions } from "@/lib/db/schema";

export type HistorySession = {
  performedOn: string;
  workoutDayName: string;
  exerciseCount: number;
};

export async function getHistory(userId: string): Promise<HistorySession[]> {
  const { db } = await import("@/lib/db");

  const rows = await db
    .select({
      performedOn: workoutSessions.performedOn,
      workoutDayName: workoutDays.name,
      exerciseCount: sql<number>`count(distinct ${sessionEntries.exerciseId})`,
    })
    .from(workoutSessions)
    .leftJoin(workoutDays, eq(workoutSessions.workoutDayId, workoutDays.id))
    .leftJoin(sessionEntries, eq(sessionEntries.workoutSessionId, workoutSessions.id))
    .where(eq(workoutSessions.userId, userId))
    .groupBy(workoutSessions.id, workoutDays.name)
    .orderBy(desc(workoutSessions.performedOn));

  return rows.map((row) => ({
    performedOn: row.performedOn,
    workoutDayName: row.workoutDayName ?? "Workout session",
    exerciseCount: Number(row.exerciseCount ?? 0),
  }));
}
