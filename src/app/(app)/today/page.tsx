import Link from "next/link";

import { TodaySession } from "@/components/today/today-session";
import { requireSession } from "@/lib/session";
import { getTodayWorkout } from "@/lib/workouts/get-today-workout";

export default async function TodayPage() {
  const session = await requireSession("/");
  const workout = await getTodayWorkout(session.user.id, new Date().getDay());

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Today
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          {workout ? workout.dayName : "No workout scheduled"}
        </h1>
        {workout ? (
          <p className="max-w-2xl text-sm text-zinc-400">
            {workout.completedExerciseCount} of {workout.totalExerciseCount}{" "}
            exercises complete.
          </p>
        ) : (
          <p className="max-w-2xl text-sm text-zinc-400">
            Today is empty. Set up your split in the editor, then come back when
            this day has assigned exercises.
          </p>
        )}
      </div>

      {workout ? (
        <TodaySession workout={workout} />
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
          <p className="text-sm text-zinc-300">
            No workout is assigned to this weekday yet.
          </p>
          <Link
            className="mt-4 inline-flex rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
            href="/editor"
          >
            Open editor
          </Link>
        </div>
      )}
    </section>
  );
}
