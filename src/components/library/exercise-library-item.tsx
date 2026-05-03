type ExerciseLibraryItemProps = {
  exercise: {
    name: string;
    imageUrl: string;
    planUsageCount: number;
  };
};

export function ExerciseLibraryItem({ exercise }: ExerciseLibraryItemProps) {
  return (
    <article className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border border-zinc-800 p-3">
      <img
        src={exercise.imageUrl}
        alt={exercise.name}
        className="h-[88px] w-[88px] rounded-md object-cover"
      />
      <div>
        <h2 className="font-medium">{exercise.name}</h2>
        <p className="text-sm text-zinc-400">{exercise.planUsageCount} plan</p>
      </div>
    </article>
  );
}
