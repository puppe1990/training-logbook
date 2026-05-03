import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppNav } from "@/components/app-nav";

describe("AppNav", () => {
  it("renders the authenticated app navigation links", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute(
      "href",
      "/today",
    );
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute(
      "href",
      "/plan",
    );
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "href",
      "/library",
    );
    expect(screen.getByRole("link", { name: "Editor" })).toHaveAttribute(
      "href",
      "/editor",
    );
  });
});
