import Link from "next/link";

import { HistorySessionCard } from "@/components/history/history-session-card";
import { getSession } from "@/lib/session";
import { getHistory } from "@/lib/workouts/get-history";

export default async function HistoryPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            History
          </p>
          <h1 className="text-3xl font-semibold text-zinc-50">
            Sign in to view your history
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Use your training logbook account to load past workout sessions.
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

  const history = await getHistory(session.user.id);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          History
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">Workout history</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Review the sessions you have already completed.
        </p>
      </div>

      {history.length ? (
        <div className="grid gap-4">
          {history.map((item) => (
            <HistorySessionCard
              key={`${item.workoutDayName}-${item.performedOn}`}
              session={item}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No workout history yet.</p>
      )}
    </section>
  );
}
