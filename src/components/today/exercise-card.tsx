"use client";

export type ExerciseCardExercise = {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
};

type ExerciseCardProps = {
  exercise: ExerciseCardExercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-zinc-50">{exercise.name}</h3>
        <p className="text-sm text-zinc-400">
          Work through each set with control.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-zinc-200">
        <span className="rounded-full bg-zinc-950 px-3 py-1">
          {exercise.sets} sets
        </span>
        <span className="rounded-full bg-zinc-950 px-3 py-1">
          {exercise.repMin}-{exercise.repMax} reps
        </span>
      </div>
    </article>
  );
}
