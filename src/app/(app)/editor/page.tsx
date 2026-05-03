import Link from "next/link";

import { DayEditor } from "@/components/editor/day-editor";
import { ExercisePicker } from "@/components/editor/exercise-picker";
import { getSession } from "@/lib/session";

const planDays = [
  { id: "lower-1", name: "Lower 1", weekday: 0 },
  { id: "upper-1", name: "Upper 1", weekday: 1 },
  { id: "lower-2", name: "Lower 2", weekday: 3 },
  { id: "upper-2", name: "Upper 2", weekday: 4 },
] as const;

const exercises = [
  { id: "leg-press", name: "Leg press" },
  { id: "bench-press", name: "Bench press" },
  { id: "lat-pulldown", name: "Lat pulldown" },
] as const;

export default async function EditorPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Editor
          </p>
          <h1 className="text-3xl font-semibold text-zinc-50">
            Sign in to edit your plan
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Use your training logbook account to change workout days and exercises.
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

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Editor
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">Plan editor</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Update your split, then choose exercises for each day.
        </p>
      </div>

      <div className="grid gap-4">
        {planDays.map((day) => (
          <DayEditor key={day.id} day={day} />
        ))}
      </div>

      <ExercisePicker exercises={exercises} selectedExerciseId="leg-press" />
    </section>
  );
}
