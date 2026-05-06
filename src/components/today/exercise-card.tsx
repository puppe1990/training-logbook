"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  buildEntryRequestBody,
  getSaveStateLabel,
  type SessionEntrySaveState,
} from "@/lib/workouts/save-session-entry";

type ExerciseCardSet = {
  setNumber: number;
  targetRepsMin: number;
  targetRepsMax: number;
  performedReps: number | null;
  weightValue: number | null;
  isCompleted: boolean;
};

export type ExerciseCardExercise = {
  dayExerciseId: string;
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  previousPerformance: {
    performedReps: number;
    weightValue: number;
  } | null;
  isExerciseCompleted: boolean;
  sets: ExerciseCardSet[];
};

type ExerciseCardProps = {
  sessionId: string | null;
  exercise: ExerciseCardExercise;
  isCurrent?: boolean;
  locked?: boolean;
  onSessionCreated?: (sessionId: string) => void;
  onCompletionChange?: (dayExerciseId: string, isCompleted: boolean) => void;
};

type SetDraft = {
  performedReps: string;
  weightValue: string;
};

function formatInputValue(value: number | null) {
  return value === null ? "" : String(value);
}

function buildInitialDrafts(sets: ExerciseCardSet[]) {
  return Object.fromEntries(
    sets.map((set) => [
      set.setNumber,
      {
        performedReps: formatInputValue(set.performedReps),
        weightValue: formatInputValue(set.weightValue),
      },
    ]),
  ) as Record<number, SetDraft>;
}

function isDraftCompleted(draft: SetDraft) {
  return draft.performedReps.trim() !== "" || draft.weightValue.trim() !== "";
}

function getCardClassName(isCompleted: boolean, isCurrent: boolean) {
  if (isCompleted) {
    return "border-emerald-500/40 bg-emerald-500/10";
  }

  if (isCurrent) {
    return "border-amber-400/50 bg-amber-400/10";
  }

  return "border-zinc-800 bg-zinc-900/80";
}

export function ExerciseCard({
  sessionId,
  exercise,
  isCurrent = false,
  locked = false,
  onSessionCreated,
  onCompletionChange,
}: ExerciseCardProps) {
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [drafts, setDrafts] = useState(() => buildInitialDrafts(exercise.sets));
  const [saveState, setSaveState] = useState<SessionEntrySaveState>("idle");
  const lastSavedDraftsRef = useRef(buildInitialDrafts(exercise.sets));
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    const nextDrafts = buildInitialDrafts(exercise.sets);

    setDrafts(nextDrafts);
    lastSavedDraftsRef.current = nextDrafts;
    setSaveState("idle");
  }, [exercise]);

  async function persistSet(set: ExerciseCardSet, draft: SetDraft) {
    if (pendingSaveRef.current) {
      return;
    }

    pendingSaveRef.current = true;
    setSaveState("saving");

    try {
      const response = await fetch("/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          buildEntryRequestBody({
            workoutSessionId: currentSessionId,
            dayExerciseId: exercise.dayExerciseId,
            exerciseId: exercise.exerciseId,
            setNumber: set.setNumber,
            targetRepsMin: set.targetRepsMin,
            targetRepsMax: set.targetRepsMax,
            performedReps: draft.performedReps,
            weightValue: draft.weightValue,
            isCompleted: isDraftCompleted(draft),
          }),
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save session entry");
      }

      const payload = (await response.json()) as {
        entry: {
          workoutSessionId: string;
        };
      };

      setCurrentSessionId(payload.entry.workoutSessionId);
      onSessionCreated?.(payload.entry.workoutSessionId);
      lastSavedDraftsRef.current = {
        ...lastSavedDraftsRef.current,
        [set.setNumber]: draft,
      };
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      pendingSaveRef.current = false;
    }
  }

  function updateDraft(
    set: ExerciseCardSet,
    field: keyof SetDraft,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,
      [set.setNumber]: {
        ...current[set.setNumber],
        [field]: value,
      },
    }));
    setSaveState("dirty");
  }

  function handleBlur(
    set: ExerciseCardSet,
    field: keyof SetDraft,
    value: string,
  ) {
    const draft = {
      ...drafts[set.setNumber],
      [field]: value,
    };
    const lastSavedDraft = lastSavedDraftsRef.current[set.setNumber];

    if (
      locked ||
      (lastSavedDraft &&
        draft.performedReps === lastSavedDraft.performedReps &&
        draft.weightValue === lastSavedDraft.weightValue)
    ) {
      return;
    }

    void persistSet(set, draft);
  }

  function copyPreviousSet(index: number) {
    const previousSet = exercise.sets[index - 1];
    const currentSet = exercise.sets[index];

    if (!previousSet || !currentSet) {
      return;
    }

    if (locked) {
      return;
    }

    const previousDraft = drafts[previousSet.setNumber];
    const nextDraft = {
      performedReps: previousDraft.performedReps,
      weightValue: previousDraft.weightValue,
    };

    setDrafts((current) => ({
      ...current,
      [currentSet.setNumber]: nextDraft,
    }));
    setSaveState("dirty");
    void persistSet(currentSet, nextDraft);
  }

  const completedSetCount =
    Object.values(drafts).filter(isDraftCompleted).length;
  const isExerciseCompleted =
    exercise.sets.length > 0 && completedSetCount === exercise.sets.length;
  const reportCompletionChange = useEffectEvent((nextIsCompleted: boolean) => {
    onCompletionChange?.(exercise.dayExerciseId, nextIsCompleted);
  });

  useEffect(() => {
    reportCompletionChange(isExerciseCompleted);
  }, [exercise.dayExerciseId, isExerciseCompleted, reportCompletionChange]);

  return (
    <article
      className={`space-y-4 rounded-3xl border p-5 ${getCardClassName(isExerciseCompleted, isCurrent)}`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-50">
            {exercise.name}
          </h3>
          <span className="text-xs font-medium text-zinc-400">
            {getSaveStateLabel(saveState)}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Work through each set with control.
        </p>
        {exercise.previousPerformance ? (
          <p className="text-sm text-zinc-500">
            Last time: {exercise.previousPerformance.performedReps} reps x{" "}
            {exercise.previousPerformance.weightValue} kg
          </p>
        ) : null}
        {isExerciseCompleted ? (
          <p className="text-sm text-emerald-300">Completed</p>
        ) : null}
        {!isExerciseCompleted && isCurrent ? (
          <p className="text-sm text-amber-200">Current focus</p>
        ) : null}
        {locked ? (
          <p className="text-sm text-zinc-500">
            Start with the current focus to create today&apos;s session.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-zinc-200">
        <span className="rounded-full bg-zinc-950 px-3 py-1">
          {exercise.sets.length} sets
        </span>
        <span className="rounded-full bg-zinc-950 px-3 py-1">
          {completedSetCount}/{exercise.sets.length} saved
        </span>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => {
          const draft = drafts[set.setNumber];

          return (
            <div
              key={set.setNumber}
              className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    Set {set.setNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Target {set.targetRepsMin}-{set.targetRepsMax} reps
                  </p>
                </div>
                {index > 0 ? (
                  <button
                    className="text-sm font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 transition hover:text-zinc-100"
                    disabled={locked}
                    type="button"
                    onClick={() => copyPreviousSet(index)}
                  >
                    Copy previous set
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Reps
                  </span>
                  <input
                    aria-label={`Set ${set.setNumber} reps`}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                    disabled={locked}
                    inputMode="numeric"
                    value={draft?.performedReps ?? ""}
                    onBlur={(event) =>
                      handleBlur(
                        set,
                        "performedReps",
                        event.currentTarget.value,
                      )
                    }
                    onChange={(event) =>
                      updateDraft(set, "performedReps", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Weight
                  </span>
                  <input
                    aria-label={`Set ${set.setNumber} weight`}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                    disabled={locked}
                    inputMode="numeric"
                    value={draft?.weightValue ?? ""}
                    onBlur={(event) =>
                      handleBlur(set, "weightValue", event.currentTarget.value)
                    }
                    onChange={(event) =>
                      updateDraft(set, "weightValue", event.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
