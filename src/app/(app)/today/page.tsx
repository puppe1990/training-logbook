import { SessionNote } from "@/components/today/session-note";
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
        <h1 className="text-3xl font-semibold text-zinc-50">Workout session</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          {workout ? workout.dayName : "No workout is loaded yet for today."}
        </p>
      </div>

      <SessionNote />
    </section>
  );
}
