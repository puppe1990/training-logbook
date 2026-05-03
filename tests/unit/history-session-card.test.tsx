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
