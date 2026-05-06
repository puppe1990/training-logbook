"use client";

type SessionNoteProps = {
  sessionId: string | null;
};

export function SessionNote({ sessionId }: SessionNoteProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-50">Session note</h2>
          <span className="text-xs font-medium text-zinc-500">
            {sessionId ? "Ready" : "Starts after first saved set"}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Capture how the session felt. Note persistence stays out of this pass.
        </p>
      </div>

      <textarea
        className="min-h-28 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!sessionId}
        placeholder={
          sessionId
            ? "How did the session go?"
            : "Save your first set to unlock notes."
        }
      />
    </section>
  );
}
