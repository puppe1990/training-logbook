import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExerciseCard } from "@/components/today/exercise-card";

describe("ExerciseCard", () => {
  it("renders exercise details", () => {
    render(
      <ExerciseCard
        exercise={{
          name: "Supino reto maquina",
          sets: 3,
          repMin: 6,
          repMax: 10,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Supino reto maquina" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 sets")).toBeInTheDocument();
    expect(screen.getByText("6-10 reps")).toBeInTheDocument();
  });
});
