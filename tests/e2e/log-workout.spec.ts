import { expect, test } from "@playwright/test";

test("today asks unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/today");

  await expect(
    page.getByRole("heading", { name: "Sign in to view today's workout" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to login" })).toBeVisible();
});

test("today login CTA leads to the login form", async ({ page }) => {
  await page.goto("/today");

  await page.getByRole("link", { name: "Go to login" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
