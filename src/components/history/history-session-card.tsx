type HistorySessionCardProps = {
  session: {
    performedOn: string;
    workoutDayName: string;
    exerciseCount: number;
  };
};

export function HistorySessionCard({ session }: HistorySessionCardProps) {
  return (
    <article className="rounded-lg border border-zinc-800 p-4">
      <h2 className="text-lg font-semibold">{session.workoutDayName}</h2>
      <p className="text-sm text-zinc-400">{session.performedOn}</p>
      <p className="text-sm text-zinc-300">{session.exerciseCount} exercises</p>
    </article>
  );
}
