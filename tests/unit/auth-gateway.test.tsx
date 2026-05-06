import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthGateway } from "@/components/auth/auth-gateway";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("AuthGateway", () => {
  it("shows login by default and switches to signup", () => {
    render(<AuthGateway />);

    expect(screen.getByRole("heading", { name: "Log in" })).toBeVisible();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Create account" })[0],
    );

    expect(
      screen.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
  });
});
