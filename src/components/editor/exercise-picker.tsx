"use client";

type ExercisePickerProps = {
  exercises: ReadonlyArray<{
    id: string;
    name: string;
  }>;
  selectedExerciseId?: string;
};

export function ExercisePicker({
  exercises,
  selectedExerciseId,
}: ExercisePickerProps) {
  return (
    <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-200">Exercise</span>
        <select
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          defaultValue={selectedExerciseId ?? exercises[0]?.id ?? ""}
          aria-label="Exercise"
        >
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
