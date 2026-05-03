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
