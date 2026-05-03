import { expect, test } from "@playwright/test";

test("today asks unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /training logbook/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("today login CTA leads to the login form", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
