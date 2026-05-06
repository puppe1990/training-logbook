export type SessionEntrySaveState =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

type EntryPayloadNormalizationInput = {
  setNumber: string | number;
  performedReps: string;
  weightValue: string;
};

type BuildEntryRequestBodyInput = {
  workoutSessionId: string | null;
  dayExerciseId: string;
  exerciseId: string;
  setNumber: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  performedReps: string;
  weightValue: string;
  isCompleted: boolean;
};

function parseRequiredInteger(value: string | number, fieldName: string) {
  const normalized = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isInteger(normalized)) {
    throw new Error(`${fieldName} must be a whole number`);
  }

  return normalized;
}

function parseOptionalInteger(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  const normalized = Number(trimmedValue);

  if (!Number.isInteger(normalized)) {
    throw new Error("Optional values must be whole numbers");
  }

  return normalized;
}

export function normalizeEntryPayload(input: EntryPayloadNormalizationInput) {
  return {
    setNumber: parseRequiredInteger(input.setNumber, "setNumber"),
    performedReps: parseOptionalInteger(input.performedReps),
    weightValue: parseOptionalInteger(input.weightValue),
  };
}

export function buildEntryRequestBody(input: BuildEntryRequestBodyInput) {
  return {
    ...(input.workoutSessionId
      ? { workoutSessionId: input.workoutSessionId }
      : {}),
    dayExerciseId: input.dayExerciseId,
    exerciseId: input.exerciseId,
    setNumber: String(input.setNumber),
    targetRepsMin: input.targetRepsMin,
    targetRepsMax: input.targetRepsMax,
    performedReps: input.performedReps.trim(),
    weightValue: input.weightValue.trim(),
    isCompleted: input.isCompleted,
  };
}

export function getSaveStateLabel(state: SessionEntrySaveState) {
  switch (state) {
    case "idle":
      return "Ready";
    case "dirty":
      return "Not saved";
    case "saving":
      return "Saving";
    case "saved":
      return "Saved";
    case "error":
      return "Error";
  }
}
