"use client";

import { useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";

type AuthMode = "login" | "signup";

type AuthGatewayProps = {
  initialMode?: AuthMode;
};

export function AuthGateway({ initialMode = "login" }: AuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-zinc-50 text-zinc-950"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
          type="button"
          onClick={() => setMode("login")}
        >
          Log in
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-zinc-50 text-zinc-950"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
          type="button"
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>

      <AuthForm mode={mode} onModeChange={setMode} />
    </div>
  );
}
