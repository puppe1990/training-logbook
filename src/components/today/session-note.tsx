"use client";

export function SessionNote() {
  return (
    <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-zinc-50">Session note</h2>
        <p className="text-sm text-zinc-400">
          Add a short note for this workout.
        </p>
      </div>

      <textarea
        className="min-h-28 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
        placeholder="How did the session go?"
      />
    </section>
  );
}
