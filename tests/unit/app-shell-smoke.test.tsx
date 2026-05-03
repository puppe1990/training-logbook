import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RootPage from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("RootPage", () => {
  it("renders the public auth landing", () => {
    render(<RootPage />);

    expect(
      screen.getByRole("heading", { name: /training logbook/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Log in" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Create account" }).length,
    ).toBeGreaterThan(0);
  });
});
