"use client";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
};

const contentByMode: Record<
  AuthFormMode,
  {
    title: string;
    description: string;
    submitLabel: string;
  }
> = {
  login: {
    title: "Log in",
    description: "Use your email and password to access your training logbook.",
    submitLabel: "Log in",
  },
  signup: {
    title: "Create account",
    description: "Start a new training logbook account with email and password.",
    submitLabel: "Create account",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const content = contentByMode[mode];

  return (
    <form className="w-full max-w-md space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Training Logbook
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">{content.title}</h1>
        <p className="text-sm text-zinc-400">{content.description}</p>
      </div>

      <div className="space-y-4">
        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">Name</span>
            <input
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
              name="name"
              type="text"
              autoComplete="name"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Email</span>
          <input
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            name="email"
            type="email"
            autoComplete="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Password</span>
          <input
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
      </div>

      <button
        className="w-full rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        type="submit"
      >
        {content.submitLabel}
      </button>
    </form>
  );
}
