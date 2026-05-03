import Link from "next/link";

import { SessionNote } from "@/components/today/session-note";
import { getSession } from "@/lib/session";
import { getTodayWorkout } from "@/lib/workouts/get-today-workout";

export default async function TodayPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Today
          </p>
          <h1 className="text-3xl font-semibold text-zinc-50">
            Sign in to view today&apos;s workout
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Use your training logbook account to load the active plan and session note.
          </p>
        </div>

        <Link
          className="inline-flex rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          href="/login"
        >
          Go to login
        </Link>
      </section>
    );
  }

  const workout = await getTodayWorkout(session.user.id, new Date().getDay());

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Today</p>
        <h1 className="text-3xl font-semibold text-zinc-50">Workout session</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          {workout
            ? workout.dayName
            : "No workout is loaded yet for today."}
        </p>
      </div>

      <SessionNote />
    </section>
  );
}
