"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
  onModeChange?: (mode: AuthFormMode) => void;
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
    description:
      "Start a new training logbook account with email and password.",
    submitLabel: "Create account",
  },
};

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const content = contentByMode[mode];
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result =
      mode === "login"
        ? await authClient.signIn.email({
            email,
            password,
          })
        : await authClient.signUp.email({
            name,
            email,
            password,
          });

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(
        result.error.message ?? "Unable to authenticate right now.",
      );
      return;
    }

    router.push("/today");
    router.refresh();
  }

  return (
    <form
      className="w-full max-w-md space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20"
      onSubmit={handleSubmit}
    >
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
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
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
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-200">Password</span>
          <input
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Working..." : content.submitLabel}
      </button>

      <p className="text-sm text-zinc-400">
        {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
        {onModeChange ? (
          <button
            className="font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-4 transition hover:text-white"
            type="button"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        ) : (
          <Link
            className="font-medium text-zinc-100 underline decoration-zinc-600 underline-offset-4 transition hover:text-white"
            href={mode === "login" ? "/signup" : "/login"}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </Link>
        )}
      </p>
    </form>
  );
}
