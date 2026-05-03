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
