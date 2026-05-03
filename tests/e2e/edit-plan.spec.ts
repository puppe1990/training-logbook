import { expect, test } from "@playwright/test";

test("editor asks unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/editor");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /training logbook/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("library renders the current exercise cards", async ({ page }) => {
  await page.goto("/library");

  await expect(
    page.getByRole("heading", { name: "Exercise library" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Supino inclinado halteres" }),
  ).toBeVisible();
  await expect(page.getByText("3 plan")).toBeVisible();
});
