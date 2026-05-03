import { ExerciseLibraryItem } from "@/components/library/exercise-library-item";

const exercises = [
  {
    name: "Supino inclinado halteres",
    imageUrl: "https://example.com/supino.jpg",
    planUsageCount: 1,
  },
  {
    name: "Agachamento livre",
    imageUrl: "https://example.com/agachamento.jpg",
    planUsageCount: 3,
  },
];

export default function LibraryPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Library
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Exercise library
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Browse the exercises available in your training plan.
        </p>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <ExerciseLibraryItem key={exercise.name} exercise={exercise} />
        ))}
      </div>
    </section>
  );
}
