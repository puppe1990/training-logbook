import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExerciseCard } from "@/components/today/exercise-card";

const fetchMock = vi.fn();

describe("ExerciseCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders one row per prescribed set with previous performance helper text", () => {
    render(
      <ExerciseCard
        sessionId={null}
        exercise={{
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          name: "Supino reto maquina",
          imageUrl: null,
          previousPerformance: {
            performedReps: 8,
            weightValue: 70,
          },
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Supino reto maquina" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last time: 8 reps x 70 kg")).toBeInTheDocument();
    expect(screen.getByLabelText("Set 1 reps")).toBeInTheDocument();
    expect(screen.getByLabelText("Set 1 weight")).toBeInTheDocument();
    expect(screen.getByLabelText("Set 2 reps")).toBeInTheDocument();
    expect(screen.getByLabelText("Set 2 weight")).toBeInTheDocument();
  });

  it("shows saved feedback after a successful blur save", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: {
          workoutSessionId: "session-1",
          exerciseId: "ex-1",
          dayExerciseId: "de-1",
          setNumber: 1,
          performedReps: 8,
          weightValue: 70,
          isCompleted: true,
        },
      }),
    });

    render(
      <ExerciseCard
        sessionId={null}
        exercise={{
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          name: "Supino reto maquina",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        }}
      />,
    );

    const repsInput = screen.getByLabelText("Set 1 reps");
    const weightInput = screen.getByLabelText("Set 1 weight");

    fireEvent.change(repsInput, { target: { value: "8" } });
    fireEvent.change(weightInput, { target: { value: "70" } });
    fireEvent.blur(weightInput);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/session-entries",
        expect.objectContaining({
          method: "POST",
        }),
      ),
    );

    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
  });

  it("shows error feedback when save fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
    });

    render(
      <ExerciseCard
        sessionId={null}
        exercise={{
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          name: "Supino reto maquina",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        }}
      />,
    );

    const repsInput = screen.getByLabelText("Set 1 reps");

    fireEvent.change(repsInput, { target: { value: "8" } });
    fireEvent.blur(repsInput);

    await waitFor(() => expect(screen.getByText("Error")).toBeInTheDocument());
  });

  it("copies the previous set into the next set and saves it", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: {
          workoutSessionId: "session-1",
          exerciseId: "ex-1",
          dayExerciseId: "de-1",
          setNumber: 2,
          performedReps: 8,
          weightValue: 70,
          isCompleted: true,
        },
      }),
    });

    render(
      <ExerciseCard
        sessionId="session-1"
        exercise={{
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          name: "Supino reto maquina",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: 8,
              weightValue: 70,
              isCompleted: true,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy previous set" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/session-entries",
        expect.objectContaining({
          method: "POST",
        }),
      ),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Set 2 reps")).toHaveValue("8"),
    );
    expect(screen.getByLabelText("Set 2 weight")).toHaveValue("70");
  });
});
