# Training Logbook Design

## Summary

Build a responsive web app for workout planning and logging. The first-run experience should support the provided split as seed data, but the product must also include an editor for creating and changing workout plans. The primary daily experience is a "workout today" screen that minimizes logging friction while still giving access to the weekly plan, exercise library, history, and editing flows.

The stack direction is Next.js with App Router and Turso as the primary database. The product must support account-based access across devices and automatically attach real exercise photos fetched online, with manual override inside the editor when the automatic choice is poor.

## Goals

- Make logging a workout fast on mobile and desktop browsers.
- Persist workout data per account and sync it across devices.
- Support both fixed plans and editable plans with reusable exercise records.
- Show a real photo for each exercise in the workout flow and exercise library.
- Seed the app with the split provided by the user.

## Non-Goals

- Native iOS or Android app in the first version.
- Video hosting or in-app video playback as a primary exercise media format.
- Social features, coach sharing, public profiles, or leaderboards.
- Advanced analytics beyond useful history and progression views.

## Product Direction

The app opens to the current day's workout instead of a generic dashboard. This is the core interaction model. Weekly navigation, history, the exercise library, and plan editing remain available, but they stay secondary to the logging flow.

This keeps the app aligned with the user's real job: open the app, see today's training, record sets, and move on.

## Primary Screens

### 1. Workout Today

The default authenticated route shows:

- current day and assigned workout day
- ordered exercise list
- exercise photo, exercise name, target sets, and target rep range
- per-set logging inputs for weight and performed reps
- completion state per exercise
- optional notes for the exercise or full session

If there is no workout assigned for the current weekday, the screen should present a useful empty state with options to choose another day or edit the plan.

### 2. Weekly Plan

Shows the plan organized by weekday, with each day linking into its full exercise list. This is the calendar-like view used for orientation and manual navigation.

### 3. History

Shows past workout sessions grouped by date and workout day. Within a session, the user can review logged sets, notes, and the exercises performed. The initial history view should optimize for scanning, not deep analytics.

### 4. Exercise Library

Shows all exercises in the account's library, each with a primary photo, aliases or variation labels where relevant, and information about which plans use the exercise. Search must be available.

### 5. Plan Editor

Supports:

- creating a plan
- creating days inside a plan
- assigning weekday labels
- adding, removing, and reordering exercises
- editing set and rep prescriptions
- selecting or replacing the exercise photo
- creating new exercises if one does not exist

## Technical Architecture

### Frontend

- Next.js App Router
- TypeScript
- Responsive UI optimized for touch first, but fully usable on desktop
- Server actions or route handlers for mutations where they fit cleanly

### Data Layer

- Turso for the relational database
- Drizzle ORM for schema, queries, and migrations

### Authentication

The product needs account-based access across devices. Because Turso is the data layer rather than a full auth platform, authentication should be implemented with a dedicated auth solution that fits Next.js cleanly and stores user identity references in Turso.

Recommended direction:

- Better Auth for sessions and email/password login
- optional social login later
- user profile rows stored in Turso and linked to auth identity

### Media Strategy

Exercise photos should be fetched automatically from an external source when a new exercise is created or seeded. The selected image URL is then stored in the database so the app is not dependent on live search during normal page loads.

The editor must allow the user to replace the chosen photo manually.

## Data Model

### users

- id
- auth_provider_user_id
- name
- email
- created_at
- updated_at

### workout_plans

- id
- user_id
- name
- is_active
- created_at
- updated_at

### workout_days

- id
- plan_id
- name
- weekday
- sort_order
- created_at
- updated_at

Examples: `Lower 1`, `Upper 1`, `Lower 2`, `Upper 2`.

### exercises

- id
- user_id nullable for shared/global records if introduced later
- name
- slug
- muscle_group
- movement_pattern nullable
- notes nullable
- created_at
- updated_at

### exercise_images

- id
- exercise_id
- image_url
- source_url nullable
- source_name nullable
- is_primary
- created_at

### day_exercises

- id
- workout_day_id
- exercise_id
- sort_order
- prescribed_sets
- rep_min
- rep_max
- instruction nullable

This table represents the plan structure for a given workout day.

### workout_sessions

- id
- user_id
- workout_day_id nullable
- performed_on
- session_note nullable
- status
- created_at
- updated_at

### session_entries

- id
- workout_session_id
- day_exercise_id nullable
- exercise_id
- set_number
- target_reps_min nullable
- target_reps_max nullable
- performed_reps nullable
- weight_value nullable
- note nullable
- is_completed

## Core Flows

### Onboarding

1. User creates an account or logs in.
2. User can start from the provided seed split.
3. The app creates a default plan and day structure.
4. Each seeded exercise triggers automatic image lookup.
5. User lands on the "workout today" screen.

### Logging a Workout

1. User opens today's workout.
2. User sees exercise cards with photos and prescriptions.
3. User logs weight and reps set by set.
4. User marks the exercise complete.
5. Completed entries use debounced autosave per exercise card so logging feels immediate without writing on every keystroke.
6. The session is visible in history.

### Editing a Plan

1. User opens the editor.
2. User creates or modifies a day.
3. User adds an exercise from the library or creates a new one.
4. The app looks for a real image automatically.
5. User can keep the image or replace it.
6. Changes are reflected on future workout sessions.

## Image Acquisition Strategy

The product requirement is "real photos searched online automatically." To keep this implementable and legally manageable in a first version:

- use the Wikimedia Commons API for automatic image lookup because it is simple to integrate, publicly accessible, and supports source attribution
- persist the chosen result instead of searching on every render
- store source metadata when available
- allow manual replacement in the editor
- use a fallback placeholder only when no result is found

The app should treat automatic image selection as assistance, not as a guaranteed perfect result.

## UX Notes

- The default route after login should never be a marketing-style home screen.
- The "workout today" view should keep logging controls close to the exercise title and image.
- The mobile layout should favor a single clean column.
- Weekly navigation and history should remain available through a compact app shell.
- Inputs must stay layout-stable while values are entered.

## Initial Seed Data

The first version should include a seed for the user's provided split:

- Lower 1 — Domingo
- Upper 1 — Segunda
- Lower 2 — Quarta
- Upper 2 — Quinta

Each day includes the exact exercises and prescribed set/rep ranges provided by the user. The seed should remain editable after import.

## Testing Strategy

- schema and migration tests for core relational integrity
- unit tests for plan/session transformations
- integration tests for auth-gated plan creation and session logging
- browser verification for login, seed import, workout logging, and plan editing

## Recommended First Milestone

Build the smallest end-to-end usable slice:

1. authentication
2. seed import of the provided split
3. workout today page
4. set logging persisted to Turso
5. simple history page
6. editor after the main loop is stable

This sequence gets a working product into the user's hands early while leaving room for iterative improvement.
