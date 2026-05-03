import Link from "next/link";

export default function RootPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.12em] text-zinc-400">
            Daily training
          </p>
          <h1 className="text-4xl font-semibold">Training Logbook</h1>
          <p className="max-w-xl text-base text-zinc-300">
            Enter the authenticated workspace to manage your training plan.
          </p>
          <Link
            className="inline-flex rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            href="/today"
          >
            Go to Today
          </Link>
        </div>
      </section>
    </main>
  );
}
