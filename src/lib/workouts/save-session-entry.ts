export function normalizeEntryPayload(input: Record<string, string>) {
  return {
    setNumber: Number(input.setNumber),
    performedReps: input.performedReps ? Number(input.performedReps) : null,
    weightValue: input.weightValue ? Number(input.weightValue) : null,
  };
}
