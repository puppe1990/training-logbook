# Workout Today Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the authenticated `Today` flow into a usable gym logging experience with real workout data, per-set inputs, visible save state, session progress, and resilient empty-state/navigation behavior.

**Architecture:** Build the feature as a vertical slice centered on `getTodayWorkout`, the `TodayPage` server component, and a client-side `ExerciseCard` logging surface. Keep persistence inside the existing `session-entries` route, expand the view model to include session/exercise state, and only add the minimum new client state needed for save-status and per-card UX feedback.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Drizzle ORM, Better Auth session helpers, Vitest, Testing Library, Playwright

---

## File Structure

### Today Flow

- `src/app/(app)/today/page.tsx` - authenticated page shell; loads today view model, renders progress/empty state, and wires session note plus exercise cards
- `src/lib/workouts/get-today-workout.ts` - single query entrypoint for today workout data and shaping it into a card-friendly view model
- `src/components/today/exercise-card.tsx` - client logging UI for one exercise, including per-set inputs, save feedback, complete state, and "copy last set" behavior
- `src/components/today/session-note.tsx` - session note form with save-state feedback
- `src/lib/workouts/save-session-entry.ts` - payload normalization plus lightweight client helpers for save-state transitions
- `src/app/api/session-entries/route.ts` - create/update persistence for session entries

### Supporting Screens

- `src/components/app-nav.tsx` - top-level authenticated navigation; must stop advertising missing routes
- `src/app/(app)/history/page.tsx` - may remain unchanged, but its data shape is the existing reference for quick-history behavior
- `src/lib/workouts/get-history.ts` - likely source for recent-performance snippets if a dedicated query is not introduced

### Tests

- `tests/unit/get-today-workout.test.ts` - view-model shaping and ordering
- `tests/unit/save-session-entry.test.ts` - normalization and save-state helpers
- `tests/unit/exercise-card.test.tsx` - rendering, interaction, and feedback
- `tests/unit/app-nav.test.tsx` - route visibility and nav behavior
- `tests/integration/session-entries-route.test.ts` - persistence contract for POST upsert behavior
- `tests/e2e/log-workout.spec.ts` - authenticated user flow through `Today`

## Task 1: Expand the Today view model around real workout data

**Files:**

- Modify: `src/lib/workouts/get-today-workout.ts`
- Test: `tests/unit/get-today-workout.test.ts`

- [ ] **Step 1: Extend the unit test to define the new view model contract**

Add coverage in `tests/unit/get-today-workout.test.ts` for:

- sorting by `sortOrder`
- preserving `exerciseId` and `dayExerciseId`
- emitting prescribed set rows with `setNumber`, `targetRepsMin`, `targetRepsMax`
- calculating `completedExerciseCount` from set completion state

Example fixture shape to use in the test:

```ts
const result = buildTodayWorkoutViewModel({
  dayName: "Upper 1",
  sessionId: "session-1",
  exercises: [
    {
      dayExerciseId: "de-2",
      exerciseId: "ex-2",
      sortOrder: 2,
      name: "Puxada aberta maquina/barra",
      prescribedSets: 2,
      repMin: 8,
      repMax: 12,
      imageUrl: null,
      previousPerformance: null,
      loggedSets: [
        { setNumber: 1, performedReps: 12, weightValue: 40, isCompleted: true },
      ],
    },
    {
      dayExerciseId: "de-1",
      exerciseId: "ex-1",
      sortOrder: 1,
      name: "Supino reto maquina",
      prescribedSets: 3,
      repMin: 6,
      repMax: 10,
      imageUrl: "https://example.com/supino.jpg",
      previousPerformance: { performedReps: 8, weightValue: 70 },
      loggedSets: [],
    },
  ],
});
```

- [ ] **Step 2: Run the unit test to confirm the current implementation is insufficient**

Run: `rtk pnpm vitest tests/unit/get-today-workout.test.ts`

Expected: FAIL because the current types only include `dayName` and basic exercise ordering.

- [ ] **Step 3: Refactor `get-today-workout.ts` to expose a richer typed view model**

Add types for:

- `TodayWorkoutLoggedSet`
- `TodayWorkoutSet`
- `TodayWorkoutPreviousPerformance`
- `TodayWorkoutExercise`
- `TodayWorkoutViewModel`

The builder should:

- sort exercises by `sortOrder`
- materialize one UI set row per prescribed set
- merge logged values by `setNumber`
- derive `isExerciseCompleted`
- derive `completedExerciseCount` and `totalExerciseCount`

Keep `getTodayWorkout()` returning `null` for now if no row plumbing exists, but update the type signature so page/components can target the real contract.

- [ ] **Step 4: Re-run the unit test**

Run: `rtk pnpm vitest tests/unit/get-today-workout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workouts/get-today-workout.ts tests/unit/get-today-workout.test.ts
git commit -m "test: define today workout view model"
```

## Task 2: Query the database for the active workout day and current session

**Files:**

- Modify: `src/lib/workouts/get-today-workout.ts`
- Test: `tests/integration/session-entries-route.test.ts`
- Test: `tests/e2e/log-workout.spec.ts`

- [ ] **Step 1: Inspect current schema relationships and map the joins needed**

The query must join:

- `workout_plans` filtered by `userId` and `isActive`
- `workout_days` filtered by `weekday`
- `day_exercises`
- `exercises`
- primary `exercise_images` when available
- `workout_sessions` for today and same `workoutDayId`
- `session_entries` for that session

Use one helper query for "today session id or create later on first save" if necessary; do not spread this logic into the page component.

- [ ] **Step 2: Implement the real `getTodayWorkout()` query**

Requirements:

- if there is no active workout day for `weekday`, return `null`
- if there is a workout day but no `workout_session` for today, still return the day/exercise structure with `sessionId: null`
- if there is a matching session, include its entries grouped by exercise/set
- include `imageUrl` only from the primary image row

- [ ] **Step 3: Add an integration assertion around idempotent entry saves**

In `tests/integration/session-entries-route.test.ts`, add a case that:

- posts the same `workoutSessionId + exerciseId + setNumber` twice
- expects update behavior instead of duplicate insert behavior

This already matches route behavior and protects the expanded `Today` autosave flow.

- [ ] **Step 4: Re-run focused tests**

Run:

- `rtk pnpm vitest tests/integration/session-entries-route.test.ts`
- `rtk pnpm vitest tests/unit/get-today-workout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workouts/get-today-workout.ts tests/integration/session-entries-route.test.ts tests/unit/get-today-workout.test.ts
git commit -m "feat: query today workout data"
```

## Task 3: Replace the placeholder `Today` page with a real training session screen

**Files:**

- Modify: `src/app/(app)/today/page.tsx`
- Modify: `src/components/today/session-note.tsx`
- Modify: `src/components/today/exercise-card.tsx`
- Test: `tests/e2e/log-workout.spec.ts`

- [ ] **Step 1: Define the page-level render states**

`TodayPage` needs three explicit states:

- loaded workout with cards
- no workout assigned today
- authenticated but empty plan/setup edge case

The page should render:

- day label and workout name
- progress summary such as `2 of 6 exercises complete`
- session note component bound to `sessionId`
- ordered exercise cards

- [ ] **Step 2: Implement the empty state before wiring the full card UX**

In `src/app/(app)/today/page.tsx`, replace the static subtitle with:

- a clear message when `getTodayWorkout()` returns `null`
- a link or button path to `/editor`
- optional secondary guidance to check another day later if the product gets weekly navigation

This closes the "screen looks broken" failure for gym users landing on an unassigned day.

- [ ] **Step 3: Render the loaded state using the richer workout view model**

For the happy path:

- map `workout.exercises` into `ExerciseCard`
- pass `sessionId`, `exerciseId`, `dayExerciseId`, set rows, prior performance, image URL, and completion state
- keep page structure single-column and mobile-first

- [ ] **Step 4: Add a basic E2E expectation for the empty-state fallback**

Extend `tests/e2e/log-workout.spec.ts` with one authenticated branch that verifies the page no longer stops at a bare note field when no workout is assigned.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(app)/today/page.tsx' src/components/today/session-note.tsx src/components/today/exercise-card.tsx tests/e2e/log-workout.spec.ts
git commit -m "feat: render real today page states"
```

## Task 4: Build per-set exercise logging with visible save state

**Files:**

- Modify: `src/components/today/exercise-card.tsx`
- Modify: `src/lib/workouts/save-session-entry.ts`
- Modify: `src/app/api/session-entries/route.ts`
- Test: `tests/unit/exercise-card.test.tsx`
- Test: `tests/unit/save-session-entry.test.ts`

- [ ] **Step 1: Expand the unit tests to define interaction behavior**

Add tests proving that `ExerciseCard`:

- renders one row per prescribed set
- shows inputs for reps and weight
- shows last-performance helper text when present
- displays save-state text (`Saving`, `Saved`, `Error`)
- supports a "Copy previous set" action

Also add tests in `save-session-entry.test.ts` for:

- blank strings becoming `null`
- invalid numeric strings being rejected or normalized consistently
- save-state helper transitions if you introduce a small reducer/helper

- [ ] **Step 2: Add minimal helper logic in `save-session-entry.ts`**

Keep this file focused on client payload shaping, for example:

- `normalizeEntryPayload()`
- `buildEntryRequestBody()`
- optional `getSaveStateLabel()` or reducer helper

Do not move network calls into a shared abstraction unless duplication becomes real.

- [ ] **Step 3: Implement client logging UI in `ExerciseCard`**

The component should support:

- rows labeled `Set 1`, `Set 2`, etc.
- controlled inputs for `performedReps` and `weightValue`
- debounced or blur-triggered POST calls to `/api/session-entries`
- local save-state feedback
- complete-state styling when all set rows are completed

Keep the interaction simple:

- on user input, mark state as `dirty`
- on debounced POST start, show `Saving`
- on success, show `Saved`
- on failure, show `Error`

- [ ] **Step 4: Tighten route validation only as much as the UI needs**

In `src/app/api/session-entries/route.ts`:

- keep the existing auth check
- continue upsert behavior
- reject obviously invalid `setNumber`
- allow `performedReps` and `weightValue` to remain nullable

Avoid overdesigning bulk-save support in this pass.

- [ ] **Step 5: Re-run focused tests**

Run:

- `rtk pnpm vitest tests/unit/exercise-card.test.tsx`
- `rtk pnpm vitest tests/unit/save-session-entry.test.ts`
- `rtk pnpm vitest tests/integration/session-entries-route.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/today/exercise-card.tsx src/lib/workouts/save-session-entry.ts src/app/api/session-entries/route.ts tests/unit/exercise-card.test.tsx tests/unit/save-session-entry.test.ts tests/integration/session-entries-route.test.ts
git commit -m "feat: add per-set logging and save feedback"
```

## Task 5: Add session progress and "next exercise" guidance

**Files:**

- Modify: `src/app/(app)/today/page.tsx`
- Modify: `src/components/today/exercise-card.tsx`
- Test: `tests/unit/exercise-card.test.tsx`

- [ ] **Step 1: Define progression rules from the view model**

Use server-shaped data where possible:

- `completedExerciseCount`
- `totalExerciseCount`
- first incomplete exercise index

Do not recompute this differently in multiple places.

- [ ] **Step 2: Render progress summary and active exercise emphasis**

Page-level:

- show a summary line like `2 of 6 exercises complete`

Card-level:

- visually distinguish completed cards
- visually highlight the first incomplete card as the current target

Keep styling changes inside existing Tailwind patterns; no new design system layer.

- [ ] **Step 3: Add unit assertions**

In `tests/unit/exercise-card.test.tsx`, verify:

- completed styling copy appears
- current-card helper copy appears only for the next incomplete exercise

- [ ] **Step 4: Re-run tests**

Run:

- `rtk pnpm vitest tests/unit/exercise-card.test.tsx`
- `rtk pnpm vitest tests/unit/get-today-workout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(app)/today/page.tsx' src/components/today/exercise-card.tsx tests/unit/exercise-card.test.tsx tests/unit/get-today-workout.test.ts
git commit -m "feat: add workout progress guidance"
```

## Task 6: Fix navigation inconsistency and reduce cognitive load

**Files:**

- Modify: `src/components/app-nav.tsx`
- Test: `tests/unit/app-nav.test.tsx`

- [ ] **Step 1: Decide the minimum viable nav fix**

Current issue: `/plan` is exposed in nav but there is no `src/app/(app)/plan/page.tsx`.

Preferred fix for this pass:

- remove `Plan` from the nav until the route exists

Alternative only if trivial:

- create a thin weekly-plan route that intentionally points to the editor model

- [ ] **Step 2: Update the nav test to lock the decision**

Add an assertion in `tests/unit/app-nav.test.tsx` that:

- visible primary actions are real routes
- `Today` remains present
- `Plan` is either absent or backed by a real route, depending on the chosen fix

- [ ] **Step 3: Implement the nav change**

Update `src/components/app-nav.tsx` so the logged-in user is not presented with dead-end navigation.

- [ ] **Step 4: Re-run focused tests**

Run: `rtk pnpm vitest tests/unit/app-nav.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/app-nav.tsx tests/unit/app-nav.test.tsx
git commit -m "fix: remove dead-end app navigation"
```

## Task 7: Upgrade end-to-end coverage for the real gym flow

**Files:**

- Modify: `tests/e2e/log-workout.spec.ts`
- Optional Modify: `tests/e2e/auth-and-seed.spec.ts`

- [ ] **Step 1: Replace the unauthenticated-only assertions with a real authenticated path**

Cover:

- login or seeded authenticated setup
- navigation to `/today`
- rendering at least one exercise card
- editing a set row
- seeing save feedback

- [ ] **Step 2: Keep one guardrail for unauthenticated access**

Preserve one redirect test to confirm `/today` still sends unauthenticated users through the gateway.

- [ ] **Step 3: Add coverage for the empty-state branch if test fixtures can represent it cheaply**

If not cheap, leave that branch in unit/server coverage and keep E2E focused on the main happy path.

- [ ] **Step 4: Run the browser suite**

Run: `rtk pnpm test:e2e -- log-workout.spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/log-workout.spec.ts tests/e2e/auth-and-seed.spec.ts
git commit -m "test: cover workout logging journey"
```

## Task 8: Verification pass and follow-up cuts

**Files:**

- Review only unless minor fixes are required in previously touched files

- [ ] **Step 1: Run the targeted full verification set**

Run:

- `rtk pnpm vitest tests/unit/get-today-workout.test.ts tests/unit/save-session-entry.test.ts tests/unit/exercise-card.test.tsx tests/unit/app-nav.test.tsx tests/integration/session-entries-route.test.ts`
- `rtk pnpm test:e2e -- log-workout.spec.ts`

Expected: PASS

- [ ] **Step 2: Manual smoke-check the authenticated flow**

Run: `rtk pnpm dev`

Then verify manually:

- `/today` shows workout data for a seeded user
- entering reps/weight updates save state
- no route in top nav is broken

- [ ] **Step 3: Record any intentionally deferred work**

Defer from this plan unless they become necessary:

- offline-first queueing
- timer/rest controls
- session-note persistence if it needs a separate endpoint
- cross-session analytics richer than "previous performance"

- [ ] **Step 4: Final commit if smoke-check fixes were required**

```bash
git add src/app/(app)/today/page.tsx src/components/today/exercise-card.tsx src/components/today/session-note.tsx src/components/app-nav.tsx src/lib/workouts/get-today-workout.ts src/lib/workouts/save-session-entry.ts src/app/api/session-entries/route.ts tests/unit/get-today-workout.test.ts tests/unit/save-session-entry.test.ts tests/unit/exercise-card.test.tsx tests/unit/app-nav.test.tsx tests/integration/session-entries-route.test.ts tests/e2e/log-workout.spec.ts
git commit -m "chore: finish today workout upgrade"
```

## Self-Review

### Spec coverage

- `Today` operational flow: covered by Tasks 1 through 5
- visible save feedback: covered by Task 4
- progress and next-exercise guidance: covered by Task 5
- navigation fix and empty-state quality: covered by Tasks 3 and 6
- real usage verification: covered by Tasks 7 and 8

### Placeholders scan

No `TODO`, `TBD`, or "appropriate error handling" placeholders are left in the tasks. The plan intentionally names deferred items in Task 8 rather than pretending they are in scope.

### Type consistency

The plan uses one source of truth for:

- `sessionId`
- `exerciseId`
- `dayExerciseId`
- per-set `setNumber`
- `performedReps`
- `weightValue`

Those names match the existing schema and API route fields to avoid translation drift.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-03-workout-today-upgrade.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
