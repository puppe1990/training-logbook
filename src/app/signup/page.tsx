import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
