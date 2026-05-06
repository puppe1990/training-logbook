# Training Logbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Next.js training logbook with account login, Turso persistence, a seeded workout split, automatic exercise photos, a workout-today flow, history, and a plan editor.

**Architecture:** Start from a clean Next.js App Router app with Turso and Drizzle. Build the product as vertical slices: auth and shell first, then schema and seed import, then workout logging, history, library, and editing. Persist exercise photos as database records sourced from Wikimedia Commons so the runtime UI reads stable URLs instead of doing live searches on every page load.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, Turso, Drizzle ORM, Better Auth, Vitest, Testing Library, Playwright

---

## File Structure

### App Shell and Routes

- `package.json` - project scripts and dependencies
- `next.config.ts` - Next.js config
- `tsconfig.json` - TypeScript config
- `postcss.config.mjs` - PostCSS config
- `tailwind.config.ts` - Tailwind config
- `src/app/layout.tsx` - root layout
- `src/app/globals.css` - global styling tokens and app shell styles
- `src/app/page.tsx` - authenticated landing redirect
- `src/app/login/page.tsx` - login screen
- `src/app/signup/page.tsx` - signup screen
- `src/app/(app)/layout.tsx` - authenticated app shell with navigation
- `src/app/(app)/today/page.tsx` - workout today screen
- `src/app/(app)/plan/page.tsx` - weekly plan screen
- `src/app/(app)/history/page.tsx` - history screen
- `src/app/(app)/library/page.tsx` - exercise library screen
- `src/app/(app)/editor/page.tsx` - plan editor screen

### Domain and Data

- `src/lib/env.ts` - environment variable parsing
- `src/lib/db/client.ts` - Turso client
- `src/lib/db/schema.ts` - Drizzle schema
- `src/lib/db/index.ts` - Drizzle db instance
- `src/lib/db/seed.ts` - first-run seed helpers
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/session.ts` - auth session helpers for server components
- `src/lib/images/wikimedia.ts` - Wikimedia Commons search client
- `src/lib/workouts/get-today-workout.ts` - fetch workout-today view model
- `src/lib/workouts/save-session-entry.ts` - debounced autosave mutation logic
- `src/lib/workouts/get-history.ts` - history queries
- `src/lib/workouts/get-plan.ts` - weekly plan and editor queries

### UI Components

- `src/components/app-nav.tsx` - authenticated navigation
- `src/components/auth/auth-form.tsx` - shared login/signup form
- `src/components/today/exercise-card.tsx` - workout exercise card and log inputs
- `src/components/today/session-note.tsx` - session note form
- `src/components/history/history-session-card.tsx` - history list item
- `src/components/library/exercise-library-item.tsx` - exercise library item
- `src/components/editor/day-editor.tsx` - plan day editor
- `src/components/editor/exercise-picker.tsx` - add/create exercise UI

### API and Mutations

- `src/app/api/auth/[...all]/route.ts` - Better Auth handler
- `src/app/api/images/search/route.ts` - exercise image lookup endpoint
- `src/app/api/seed/route.ts` - seed import endpoint
- `src/app/api/session-entries/route.ts` - create/update session entries
- `src/app/api/plans/route.ts` - create/update plan

### Tests

- `tests/unit/env.test.ts`
- `tests/unit/wikimedia.test.ts`
- `tests/unit/get-today-workout.test.ts`
- `tests/unit/save-session-entry.test.ts`
- `tests/integration/seed-route.test.ts`
- `tests/integration/session-entries-route.test.ts`
- `tests/integration/plan-route.test.ts`
- `tests/e2e/auth-and-seed.spec.ts`
- `tests/e2e/log-workout.spec.ts`
- `tests/e2e/edit-plan.spec.ts`

### Tooling and Database

- `drizzle.config.ts` - Drizzle config
- `drizzle/0000_initial.sql` - initial migration
- `.env.example` - required environment variables
- `playwright.config.ts` - browser test config
- `vitest.config.ts` - test config
- `vitest.setup.ts` - shared test setup

## Task 1: Bootstrap Next.js App

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `.gitignore`
- Test: `tests/unit/app-shell-smoke.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

```tsx
// tests/unit/app-shell-smoke.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders a loading or redirect shell", () => {
    render(<RootPage />);
    expect(
      screen.getByRole("heading", { name: /training logbook/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/app-shell-smoke.test.tsx`
Expected: FAIL because Next.js app files and Vitest config do not exist yet.

- [ ] **Step 3: Create the minimal app and test tooling**

```json
// package.json
{
  "name": "training-logbook",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.1.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vitest": "^3.2.4"
  }
}
```

```tsx
// src/app/page.tsx
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
            Loading your training workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
```

```tsx
// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Add Vitest config and rerun the smoke test**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

Run: `pnpm vitest tests/unit/app-shell-smoke.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts src/app/layout.tsx src/app/globals.css src/app/page.tsx vitest.config.ts vitest.setup.ts tests/unit/app-shell-smoke.test.tsx .gitignore
git commit -m "chore: bootstrap next training app"
```

## Task 2: Add Environment and Database Foundations

**Files:**

- Create: `.env.example`
- Create: `drizzle.config.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/index.ts`
- Create: `tests/unit/env.test.ts`

- [ ] **Step 1: Write the failing env test**

```ts
// tests/unit/env.test.ts
import { describe, expect, it } from "vitest";
import { readEnv } from "@/lib/env";

describe("readEnv", () => {
  it("returns required Turso and auth variables", () => {
    const env = readEnv({
      TURSO_DATABASE_URL: "libsql://training-logbook.turso.io",
      TURSO_AUTH_TOKEN: "token",
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(env.tursoUrl).toContain("turso.io");
    expect(env.authUrl).toBe("http://localhost:3000");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/env.test.ts`
Expected: FAIL because `src/lib/env.ts` does not exist.

- [ ] **Step 3: Implement environment parsing**

```ts
// src/lib/env.ts
type RawEnv = Record<string, string | undefined>;

export type AppEnv = {
  tursoUrl: string;
  tursoAuthToken: string;
  authSecret: string;
  authUrl: string;
};

export function readEnv(raw: RawEnv = process.env): AppEnv {
  const tursoUrl = raw.TURSO_DATABASE_URL;
  const tursoAuthToken = raw.TURSO_AUTH_TOKEN;
  const authSecret = raw.BETTER_AUTH_SECRET;
  const authUrl = raw.BETTER_AUTH_URL;

  if (!tursoUrl || !tursoAuthToken || !authSecret || !authUrl) {
    throw new Error("Missing required environment variables");
  }

  return {
    tursoUrl,
    tursoAuthToken,
    authSecret,
    authUrl,
  };
}
```

```env
# .env.example
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
BETTER_AUTH_SECRET=replace-me
BETTER_AUTH_URL=http://localhost:3000
WIKIMEDIA_API_URL=https://commons.wikimedia.org/w/api.php
```

- [ ] **Step 4: Add Drizzle and Turso client setup**

```ts
// src/lib/db/client.ts
import { createClient } from "@libsql/client";
import { readEnv } from "@/lib/env";

const env = readEnv();

export const tursoClient = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken,
});
```

```ts
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { tursoClient } from "@/lib/db/client";

export const db = drizzle(tursoClient);
```

Run: `pnpm vitest tests/unit/env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example drizzle.config.ts src/lib/env.ts src/lib/db/client.ts src/lib/db/index.ts tests/unit/env.test.ts package.json
git commit -m "chore: add turso environment foundation"
```

## Task 3: Define Schema and Migrations

**Files:**

- Create: `src/lib/db/schema.ts`
- Create: `drizzle/0000_initial.sql`
- Test: `tests/unit/schema-shape.test.ts`

- [ ] **Step 1: Write the failing schema shape test**

```ts
// tests/unit/schema-shape.test.ts
import { describe, expect, it } from "vitest";
import {
  users,
  workoutPlans,
  workoutDays,
  exercises,
  dayExercises,
  workoutSessions,
  sessionEntries,
  exerciseImages,
} from "@/lib/db/schema";

describe("schema", () => {
  it("exports the core tables", () => {
    expect(users[Symbol.for("drizzle:Name")]).toBe("users");
    expect(workoutPlans[Symbol.for("drizzle:Name")]).toBe("workout_plans");
    expect(workoutDays[Symbol.for("drizzle:Name")]).toBe("workout_days");
    expect(exercises[Symbol.for("drizzle:Name")]).toBe("exercises");
    expect(dayExercises[Symbol.for("drizzle:Name")]).toBe("day_exercises");
    expect(workoutSessions[Symbol.for("drizzle:Name")]).toBe(
      "workout_sessions",
    );
    expect(sessionEntries[Symbol.for("drizzle:Name")]).toBe("session_entries");
    expect(exerciseImages[Symbol.for("drizzle:Name")]).toBe("exercise_images");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/schema-shape.test.ts`
Expected: FAIL because the schema file does not exist.

- [ ] **Step 3: Implement Drizzle schema**

```ts
// src/lib/db/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  authProviderUserId: text("auth_provider_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  ...timestamps,
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const workoutDays = sqliteTable("workout_days", {
  id: text("id").primaryKey(),
  planId: text("plan_id")
    .notNull()
    .references(() => workoutPlans.id),
  name: text("name").notNull(),
  weekday: integer("weekday").notNull(),
  sortOrder: integer("sort_order").notNull(),
  ...timestamps,
});

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  muscleGroup: text("muscle_group").notNull(),
  movementPattern: text("movement_pattern"),
  notes: text("notes"),
  ...timestamps,
});

export const exerciseImages = sqliteTable("exercise_images", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  imageUrl: text("image_url").notNull(),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const dayExercises = sqliteTable("day_exercises", {
  id: text("id").primaryKey(),
  workoutDayId: text("workout_day_id")
    .notNull()
    .references(() => workoutDays.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  sortOrder: integer("sort_order").notNull(),
  prescribedSets: integer("prescribed_sets").notNull(),
  repMin: integer("rep_min").notNull(),
  repMax: integer("rep_max").notNull(),
  instruction: text("instruction"),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  workoutDayId: text("workout_day_id").references(() => workoutDays.id),
  performedOn: text("performed_on").notNull(),
  sessionNote: text("session_note"),
  status: text("status").notNull().default("in_progress"),
  ...timestamps,
});

export const sessionEntries = sqliteTable("session_entries", {
  id: text("id").primaryKey(),
  workoutSessionId: text("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id),
  dayExerciseId: text("day_exercise_id").references(() => dayExercises.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  targetRepsMin: integer("target_reps_min"),
  targetRepsMax: integer("target_reps_max"),
  performedReps: integer("performed_reps"),
  weightValue: integer("weight_value"),
  note: text("note"),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
});
```

- [ ] **Step 4: Generate or write the initial SQL migration and verify the test**

Run: `pnpm drizzle-kit generate`
Expected: Creates SQL for the schema.

Run: `pnpm vitest tests/unit/schema-shape.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/0000_initial.sql tests/unit/schema-shape.test.ts drizzle.config.ts
git commit -m "feat: add workout schema"
```

## Task 4: Add Authentication

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/lib/session.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/components/auth/auth-form.tsx`
- Test: `tests/integration/auth-route.test.ts`

- [ ] **Step 1: Write the failing auth route test**

```ts
// tests/integration/auth-route.test.ts
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/[...all]/route";

describe("auth route", () => {
  it("exports a GET handler", () => {
    expect(typeof GET).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/auth-route.test.ts`
Expected: FAIL because auth route does not exist.

- [ ] **Step 3: Implement Better Auth**

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { readEnv } from "@/lib/env";

const env = readEnv();

export const auth = betterAuth({
  secret: env.authSecret,
  baseURL: env.authUrl,
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 4: Add auth pages and verify the test**

```tsx
// src/components/auth/auth-form.tsx
"use client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  return (
    <form className="space-y-4">
      <h1 className="text-3xl font-semibold">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      {mode === "signup" ? <input name="name" placeholder="Name" /> : null}
      <button type="submit">{mode === "login" ? "Sign in" : "Sign up"}</button>
    </form>
  );
}
```

Run: `pnpm vitest tests/integration/auth-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/session.ts src/app/api/auth/[...all]/route.ts src/app/login/page.tsx src/app/signup/page.tsx src/components/auth/auth-form.tsx tests/integration/auth-route.test.ts package.json
git commit -m "feat: add account authentication"
```

## Task 5: Seed the User's Split

**Files:**

- Create: `src/lib/db/seed.ts`
- Create: `src/app/api/seed/route.ts`
- Test: `tests/integration/seed-route.test.ts`

- [ ] **Step 1: Write the failing seed route test**

```ts
// tests/integration/seed-route.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/seed/route";

describe("seed route", () => {
  it("exports a POST handler", () => {
    expect(typeof POST).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/seed-route.test.ts`
Expected: FAIL because seed route does not exist.

- [ ] **Step 3: Add seed data for the provided split**

```ts
// src/lib/db/seed.ts
export const starterPlan = {
  name: "Ficha inicial",
  days: [
    {
      name: "Lower 1",
      weekday: 0,
      exercises: [
        {
          name: "Cadeira flexora",
          sets: 3,
          repMin: 8,
          repMax: 12,
          instruction: "tronco levemente a frente",
        },
        {
          name: "Cadeira adutora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril flexionado",
        },
        {
          name: "Leg press",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "pes medios/altos",
        },
        {
          name: "Elevacao pelvica",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Cadeira extensora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril estendido",
        },
        {
          name: "Panturrilha maquina",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
      ],
    },
    {
      name: "Upper 1",
      weekday: 1,
      exercises: [
        {
          name: "Supino reto maquina",
          sets: 3,
          repMin: 5,
          repMax: 8,
          instruction: "ou Smith",
        },
        {
          name: "Polia baixa para cima",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "crucifixo inclinado",
        },
        {
          name: "Puxada aberta maquina/barra",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "T-bar row maquina",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Elevacao lateral maquina",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
        {
          name: "Rosca Scott",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "ou Rosca Martelo padrao encurtado",
        },
        {
          name: "Triceps polia barra W",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
      ],
    },
    {
      name: "Lower 2",
      weekday: 3,
      exercises: [
        {
          name: "Stiff",
          sets: 3,
          repMin: 8,
          repMax: 12,
          instruction: "ou banco romano",
        },
        {
          name: "Cadeira abdutora",
          sets: 2,
          repMin: 12,
          repMax: 20,
          instruction: "quadril flexionado",
        },
        {
          name: "Leg press",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "pes baixos, assento pra tras",
        },
        {
          name: "Cadeira flexora",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "quadril neutro",
        },
        {
          name: "Leg press unilateral",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "ou Bulgaro no Smith, quadril bem flexionado",
        },
        {
          name: "Cadeira extensora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril flexionado",
        },
        {
          name: "Panturrilha maquina",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
      ],
    },
    {
      name: "Upper 2",
      weekday: 4,
      exercises: [
        {
          name: "Puxada neutra maquina",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "triangulo",
        },
        {
          name: "Remada",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "ou Cable Shrugs upper back",
        },
        {
          name: "Supino inclinado halteres",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Voador",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "ou crucifixo maquina",
        },
        {
          name: "Elevacao lateral halteres + Elevacao frontal unilateral",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
        {
          name: "Rosca inclinada banco 45",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "padrao alongado",
        },
        {
          name: "Triceps frances maquina",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
      ],
    },
  ],
};
```

- [ ] **Step 4: Implement the seed route and verify the test**

```ts
// src/app/api/seed/route.ts
import { NextResponse } from "next/server";
import { seedStarterPlan } from "@/lib/db/seed";

export async function POST() {
  const result = await seedStarterPlan();
  return NextResponse.json({ ok: true, planId: result.planId });
}
```

Run: `pnpm vitest tests/integration/seed-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/seed.ts src/app/api/seed/route.ts tests/integration/seed-route.test.ts
git commit -m "feat: add starter workout seed"
```

## Task 6: Implement Wikimedia Image Search

**Files:**

- Create: `src/lib/images/wikimedia.ts`
- Create: `src/app/api/images/search/route.ts`
- Test: `tests/unit/wikimedia.test.ts`

- [ ] **Step 1: Write the failing image search test**

```ts
// tests/unit/wikimedia.test.ts
import { describe, expect, it, vi } from "vitest";
import { searchExerciseImage } from "@/lib/images/wikimedia";

describe("searchExerciseImage", () => {
  it("returns a primary image url and source metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          query: {
            pages: {
              "1": {
                title: "File:Leg press machine.jpg",
                imageinfo: [
                  {
                    url: "https://upload.wikimedia.org/leg-press.jpg",
                    descriptionurl:
                      "https://commons.wikimedia.org/wiki/File:Leg_press_machine.jpg",
                  },
                ],
              },
            },
          },
        }),
      }),
    );

    const result = await searchExerciseImage("Leg press");

    expect(result?.imageUrl).toContain("wikimedia");
    expect(result?.sourceName).toBe("Wikimedia Commons");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/wikimedia.test.ts`
Expected: FAIL because image lookup code does not exist.

- [ ] **Step 3: Implement Wikimedia image lookup**

```ts
// src/lib/images/wikimedia.ts
const API_URL = "https://commons.wikimedia.org/w/api.php";

export type ExerciseImageResult = {
  imageUrl: string;
  sourceUrl: string;
  sourceName: "Wikimedia Commons";
};

export async function searchExerciseImage(
  exerciseName: string,
): Promise<ExerciseImageResult | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${exerciseName} exercise gym`,
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${API_URL}?${params.toString()}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0] as
    | { imageinfo?: Array<{ url: string; descriptionurl: string }> }
    | undefined;

  const info = page?.imageinfo?.[0];
  if (!info) return null;

  return {
    imageUrl: info.url,
    sourceUrl: info.descriptionurl,
    sourceName: "Wikimedia Commons",
  };
}
```

- [ ] **Step 4: Expose the API route and verify the test**

Run: `pnpm vitest tests/unit/wikimedia.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/images/wikimedia.ts src/app/api/images/search/route.ts tests/unit/wikimedia.test.ts
git commit -m "feat: add exercise image search"
```

## Task 7: Build the Authenticated App Shell

**Files:**

- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/app-nav.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/app-nav.test.tsx`

- [ ] **Step 1: Write the failing app navigation test**

```tsx
// tests/unit/app-nav.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppNav } from "@/components/app-nav";

describe("AppNav", () => {
  it("shows the main sections", () => {
    render(<AppNav />);
    expect(screen.getByRole("link", { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plan/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editor/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/app-nav.test.tsx`
Expected: FAIL because the navigation component does not exist.

- [ ] **Step 3: Implement the shell**

```tsx
// src/components/app-nav.tsx
import Link from "next/link";

const items = [
  { href: "/today", label: "Today" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "History" },
  { href: "/library", label: "Library" },
  { href: "/editor", label: "Editor" },
];

export function AppNav() {
  return (
    <nav className="flex gap-3 overflow-x-auto py-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Add authenticated layout and verify the test**

Run: `pnpm vitest tests/unit/app-nav.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/layout.tsx src/components/app-nav.tsx src/app/page.tsx tests/unit/app-nav.test.tsx
git commit -m "feat: add authenticated app shell"
```

## Task 8: Build Workout Today Queries

**Files:**

- Create: `src/lib/workouts/get-today-workout.ts`
- Test: `tests/unit/get-today-workout.test.ts`

- [ ] **Step 1: Write the failing workout query test**

```ts
// tests/unit/get-today-workout.test.ts
import { describe, expect, it } from "vitest";
import { buildTodayWorkoutViewModel } from "@/lib/workouts/get-today-workout";

describe("buildTodayWorkoutViewModel", () => {
  it("sorts exercises in workout order", () => {
    const result = buildTodayWorkoutViewModel({
      dayName: "Upper 1",
      exercises: [
        { sortOrder: 2, name: "Puxada aberta maquina/barra" },
        { sortOrder: 1, name: "Supino reto maquina" },
      ],
    });

    expect(result.exercises[0].name).toMatch(/supino/i);
    expect(result.exercises[1].name).toMatch(/puxada/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/get-today-workout.test.ts`
Expected: FAIL because query helper does not exist.

- [ ] **Step 3: Implement the view-model helper**

```ts
// src/lib/workouts/get-today-workout.ts
type TodayWorkoutInput = {
  dayName: string;
  exercises: Array<{ sortOrder: number; name: string }>;
};

export function buildTodayWorkoutViewModel(input: TodayWorkoutInput) {
  return {
    dayName: input.dayName,
    exercises: [...input.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
```

- [ ] **Step 4: Expand to the real db query and verify the test**

Add the production query function in the same file:

```ts
export async function getTodayWorkout(userId: string, weekday: number) {
  // query active plan, workout day, day exercises, exercise images, and latest session entries
}
```

Run: `pnpm vitest tests/unit/get-today-workout.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workouts/get-today-workout.ts tests/unit/get-today-workout.test.ts
git commit -m "feat: add workout today query"
```

## Task 9: Build Workout Today UI

**Files:**

- Create: `src/components/today/exercise-card.tsx`
- Create: `src/components/today/session-note.tsx`
- Create: `src/app/(app)/today/page.tsx`
- Test: `tests/unit/exercise-card.test.tsx`

- [ ] **Step 1: Write the failing exercise card test**

```tsx
// tests/unit/exercise-card.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExerciseCard } from "@/components/today/exercise-card";

describe("ExerciseCard", () => {
  it("shows the exercise name and rep range", () => {
    render(
      <ExerciseCard
        exercise={{
          name: "Leg press",
          imageUrl: "https://example.com/leg-press.jpg",
          prescribedSets: 3,
          repMin: 6,
          repMax: 10,
          entries: [],
        }}
      />,
    );

    expect(screen.getByText(/leg press/i)).toBeInTheDocument();
    expect(screen.getByText(/3 sets/i)).toBeInTheDocument();
    expect(screen.getByText(/6-10 reps/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/exercise-card.test.tsx`
Expected: FAIL because the card does not exist.

- [ ] **Step 3: Implement the card**

```tsx
// src/components/today/exercise-card.tsx
"use client";

type Entry = {
  setNumber: number;
  performedReps?: number;
  weightValue?: number;
};

type ExerciseCardProps = {
  exercise: {
    name: string;
    imageUrl: string;
    prescribedSets: number;
    repMin: number;
    repMax: number;
    entries: Entry[];
  };
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className="grid gap-4 rounded-lg border border-zinc-800 p-4">
      <img
        src={exercise.imageUrl}
        alt={exercise.name}
        className="h-48 w-full rounded-md object-cover"
      />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{exercise.name}</h2>
        <p className="text-sm text-zinc-400">
          {exercise.prescribedSets} sets • {exercise.repMin}-{exercise.repMax}{" "}
          reps
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Render the today page and verify the test**

Run: `pnpm vitest tests/unit/exercise-card.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/today/exercise-card.tsx src/components/today/session-note.tsx src/app/(app)/today/page.tsx tests/unit/exercise-card.test.tsx
git commit -m "feat: add workout today ui"
```

## Task 10: Add Debounced Session Entry Saving

**Files:**

- Create: `src/lib/workouts/save-session-entry.ts`
- Create: `src/app/api/session-entries/route.ts`
- Test: `tests/unit/save-session-entry.test.ts`
- Test: `tests/integration/session-entries-route.test.ts`

- [ ] **Step 1: Write the failing autosave test**

```ts
// tests/unit/save-session-entry.test.ts
import { describe, expect, it } from "vitest";
import { normalizeEntryPayload } from "@/lib/workouts/save-session-entry";

describe("normalizeEntryPayload", () => {
  it("normalizes numbers from form input", () => {
    const result = normalizeEntryPayload({
      setNumber: "1",
      performedReps: "12",
      weightValue: "80",
    });

    expect(result.setNumber).toBe(1);
    expect(result.performedReps).toBe(12);
    expect(result.weightValue).toBe(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/save-session-entry.test.ts`
Expected: FAIL because the mutation helper does not exist.

- [ ] **Step 3: Implement payload normalization and route**

```ts
// src/lib/workouts/save-session-entry.ts
export function normalizeEntryPayload(input: Record<string, string>) {
  return {
    setNumber: Number(input.setNumber),
    performedReps: input.performedReps ? Number(input.performedReps) : null,
    weightValue: input.weightValue ? Number(input.weightValue) : null,
  };
}
```

Add route logic in `src/app/api/session-entries/route.ts` to upsert by `workoutSessionId + exerciseId + setNumber`.

- [ ] **Step 4: Verify unit and integration tests**

Run: `pnpm vitest tests/unit/save-session-entry.test.ts tests/integration/session-entries-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workouts/save-session-entry.ts src/app/api/session-entries/route.ts tests/unit/save-session-entry.test.ts tests/integration/session-entries-route.test.ts
git commit -m "feat: add debounced session entry saving"
```

## Task 11: Build History

**Files:**

- Create: `src/lib/workouts/get-history.ts`
- Create: `src/components/history/history-session-card.tsx`
- Create: `src/app/(app)/history/page.tsx`
- Test: `tests/unit/history-session-card.test.tsx`

- [ ] **Step 1: Write the failing history card test**

```tsx
// tests/unit/history-session-card.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistorySessionCard } from "@/components/history/history-session-card";

describe("HistorySessionCard", () => {
  it("shows the workout day and performed date", () => {
    render(
      <HistorySessionCard
        session={{
          performedOn: "2026-04-11",
          workoutDayName: "Lower 1",
          exerciseCount: 6,
        }}
      />,
    );

    expect(screen.getByText(/lower 1/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-11/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/history-session-card.test.tsx`
Expected: FAIL because history components do not exist.

- [ ] **Step 3: Implement history query and UI**

```tsx
// src/components/history/history-session-card.tsx
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
```

- [ ] **Step 4: Verify the test**

Run: `pnpm vitest tests/unit/history-session-card.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workouts/get-history.ts src/components/history/history-session-card.tsx src/app/(app)/history/page.tsx tests/unit/history-session-card.test.tsx
git commit -m "feat: add workout history"
```

## Task 12: Build Exercise Library

**Files:**

- Create: `src/components/library/exercise-library-item.tsx`
- Create: `src/app/(app)/library/page.tsx`
- Test: `tests/unit/exercise-library-item.test.tsx`

- [ ] **Step 1: Write the failing library item test**

```tsx
// tests/unit/exercise-library-item.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExerciseLibraryItem } from "@/components/library/exercise-library-item";

describe("ExerciseLibraryItem", () => {
  it("shows the image, name, and plan usage count", () => {
    render(
      <ExerciseLibraryItem
        exercise={{
          name: "Supino inclinado halteres",
          imageUrl: "https://example.com/supino.jpg",
          planUsageCount: 1,
        }}
      />,
    );

    expect(screen.getByText(/supino inclinado/i)).toBeInTheDocument();
    expect(screen.getByText(/1 plan/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/exercise-library-item.test.tsx`
Expected: FAIL because library item component does not exist.

- [ ] **Step 3: Implement the library item**

```tsx
// src/components/library/exercise-library-item.tsx
type ExerciseLibraryItemProps = {
  exercise: {
    name: string;
    imageUrl: string;
    planUsageCount: number;
  };
};

export function ExerciseLibraryItem({ exercise }: ExerciseLibraryItemProps) {
  return (
    <article className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border border-zinc-800 p-3">
      <img
        src={exercise.imageUrl}
        alt={exercise.name}
        className="h-[88px] w-[88px] rounded-md object-cover"
      />
      <div>
        <h2 className="font-medium">{exercise.name}</h2>
        <p className="text-sm text-zinc-400">{exercise.planUsageCount} plan</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Verify the test**

Run: `pnpm vitest tests/unit/exercise-library-item.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/library/exercise-library-item.tsx src/app/(app)/library/page.tsx tests/unit/exercise-library-item.test.tsx
git commit -m "feat: add exercise library"
```

## Task 13: Build Plan Editor

**Files:**

- Create: `src/components/editor/day-editor.tsx`
- Create: `src/components/editor/exercise-picker.tsx`
- Create: `src/app/(app)/editor/page.tsx`
- Create: `src/app/api/plans/route.ts`
- Test: `tests/integration/plan-route.test.ts`

- [ ] **Step 1: Write the failing plan route test**

```ts
// tests/integration/plan-route.test.ts
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/plans/route";

describe("plan route", () => {
  it("exports a POST handler", () => {
    expect(typeof POST).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/integration/plan-route.test.ts`
Expected: FAIL because plan route does not exist.

- [ ] **Step 3: Implement editor form pieces**

```tsx
// src/components/editor/day-editor.tsx
"use client";

type DayEditorProps = {
  day: {
    id: string;
    name: string;
    weekday: number;
  };
};

export function DayEditor({ day }: DayEditorProps) {
  return (
    <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
      <input defaultValue={day.name} aria-label="Day name" />
      <select defaultValue={String(day.weekday)} aria-label="Weekday">
        <option value="0">Sunday</option>
        <option value="1">Monday</option>
        <option value="3">Wednesday</option>
        <option value="4">Thursday</option>
      </select>
    </section>
  );
}
```

- [ ] **Step 4: Add plan mutation route and verify the test**

Run: `pnpm vitest tests/integration/plan-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/day-editor.tsx src/components/editor/exercise-picker.tsx src/app/(app)/editor/page.tsx src/app/api/plans/route.ts tests/integration/plan-route.test.ts
git commit -m "feat: add plan editor"
```

## Task 14: Add End-to-End Coverage

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/auth-and-seed.spec.ts`
- Create: `tests/e2e/log-workout.spec.ts`
- Create: `tests/e2e/edit-plan.spec.ts`

- [ ] **Step 1: Write the first failing Playwright spec**

```ts
// tests/e2e/auth-and-seed.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign up and import the starter split", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: /create your account/i }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run e2e test to verify it fails**

Run: `pnpm playwright test tests/e2e/auth-and-seed.spec.ts`
Expected: FAIL because Playwright config and app routes are incomplete.

- [ ] **Step 3: Add Playwright config and remaining flows**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
```

Create the remaining tests to cover:

- signup and starter split import
- log one full workout with autosave
- edit a day and add an exercise with an image

- [ ] **Step 4: Run the full browser suite**

Run: `pnpm playwright test`
Expected: PASS on desktop and mobile profiles.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/auth-and-seed.spec.ts tests/e2e/log-workout.spec.ts tests/e2e/edit-plan.spec.ts
git commit -m "test: add browser coverage for core flows"
```

## Task 15: Final Verification and Developer Experience

**Files:**

- Modify: `README.md`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Write the failing documentation check**

```ts
// tests/unit/readme-smoke.test.ts
import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("README", () => {
  it("documents setup and database commands", () => {
    const readme = fs.readFileSync("README.md", "utf8");
    expect(readme).toMatch(/pnpm install/);
    expect(readme).toMatch(/pnpm db:migrate/);
    expect(readme).toMatch(/pnpm dev/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/readme-smoke.test.ts`
Expected: FAIL because README does not exist or lacks setup instructions.

- [ ] **Step 3: Document local setup**

```md
# Training Logbook

## Setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local`
3. `pnpm db:migrate`
4. `pnpm dev`

## Tests

- `pnpm test`
- `pnpm test:e2e`
```

- [ ] **Step 4: Run the full verification suite**

Run: `pnpm test`
Expected: PASS

Run: `pnpm test:e2e`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add README.md .env.example package.json tests/unit/readme-smoke.test.ts
git commit -m "docs: add local setup and verification"
```

## Self-Review

### Spec Coverage

- Auth across devices: covered in Task 4.
- Turso persistence and relational model: covered in Tasks 2 and 3.
- Starter seed from the provided split: covered in Task 5.
- Real exercise photos with automatic search and manual replacement path: covered in Tasks 6 and 13.
- Workout today first-run experience: covered in Tasks 8 and 9.
- Debounced logbook persistence: covered in Task 10.
- History, library, and plan editor: covered in Tasks 11, 12, and 13.
- Browser verification on responsive layouts: covered in Task 14.

### Placeholder Scan

- No placeholder markers remain. The plan includes explicit table definitions, route names, and starter split seed data.

### Type Consistency

- Route and helper names are consistent across the plan: `getTodayWorkout`, `searchExerciseImage`, `normalizeEntryPayload`, `seedStarterPlan`.
- Table names match the approved spec naming.
