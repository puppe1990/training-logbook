import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const { push, refresh, signInEmail, signUpEmail } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: signInEmail,
    },
    signUp: {
      email: signUpEmail,
    },
  },
}));

describe("AuthForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    signInEmail.mockReset();
    signUpEmail.mockReset();
  });

  it("renders the login variant with a link to signup", () => {
    render(<AuthForm mode="login" />);

    expect(screen.getByRole("heading", { name: "Log in" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("renders the signup variant with a name field and a link to login", () => {
    render(<AuthForm mode="signup" />);

    expect(
      screen.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("submits login credentials and routes to today on success", async () => {
    signInEmail.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "matheus@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "test123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(signInEmail).toHaveBeenCalledWith({
        email: "matheus@example.com",
        password: "test123456",
      });
    });

    expect(push).toHaveBeenCalledWith("/today");
    expect(refresh).toHaveBeenCalled();
  });

  it("submits signup credentials and routes to today on success", async () => {
    signUpEmail.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    render(<AuthForm mode="signup" />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Matheus" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "matheus@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "test123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUpEmail).toHaveBeenCalledWith({
        email: "matheus@example.com",
        name: "Matheus",
        password: "test123456",
      });
    });

    expect(push).toHaveBeenCalledWith("/today");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the auth error message when signup fails", async () => {
    signUpEmail.mockResolvedValue({
      data: null,
      error: { message: "User already exists" },
    });

    render(<AuthForm mode="signup" />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Matheus" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "matheus@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "test123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeVisible();
    });

    expect(push).not.toHaveBeenCalled();
  });
});
