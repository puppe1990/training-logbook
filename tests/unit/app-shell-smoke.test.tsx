import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders a loading or redirect shell", () => {
    render(<RootPage />);

    expect(
      screen.getByRole("heading", { name: /training logbook/i }),
    ).toBeInTheDocument();
  });
});
