import { expect, test } from "@playwright/test";

test("signup page shows the account creation heading", async ({ page }) => {
  await page.goto("/signup");

  await expect(
    page.getByRole("heading", { name: "Create account" }),
  ).toBeVisible();
});

test("seed route returns the starter plan id", async ({ request }) => {
  const response = await request.post("/api/seed");

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({
    error: "Unauthorized",
  });
});
