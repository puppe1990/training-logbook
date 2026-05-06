import { AuthGateway } from "@/components/auth/auth-gateway";

type AuthLandingProps = {
  initialMode?: "login" | "signup";
};

export function AuthLanding({ initialMode = "login" }: AuthLandingProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              Daily training
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Training Logbook for people who actually train with intent
            </h1>
            <p className="max-w-2xl text-base text-zinc-300">
              Keep your split, log your sessions, and continue from any device
              without losing the thread of your training.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Today
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Open the current workout instead of hunting for notes.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                History
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Track what you actually completed, not what you intended.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Editor
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Adjust the plan when the real world changes the week.
              </p>
            </div>
          </div>
        </div>

        <AuthGateway initialMode={initialMode} />
      </section>
    </main>
  );
}
