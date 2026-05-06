import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Gym User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account" })
    .click();
  await expect(page).toHaveURL(/\/today$/);
}

test("today asks unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/today");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /training logbook/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("today shows the empty state before the user has a plan", async ({
  page,
}) => {
  await signUp(page, `empty-${Date.now()}@example.com`);

  await expect(
    page.getByRole("heading", { name: "No workout scheduled" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open editor" })).toHaveAttribute(
    "href",
    "/editor",
  );
});

test("authenticated user can seed a plan and log the first set", async ({
  page,
}) => {
  await signUp(page, `seed-${Date.now()}@example.com`);

  const seedResponse = await page.evaluate(async () => {
    const response = await fetch("/api/seed", {
      method: "POST",
    });

    return {
      ok: response.ok,
      body: await response.json(),
    };
  });

  expect(seedResponse.ok).toBe(true);
  await page.goto("/today");

  const card = page.locator("article").first();

  await expect(
    card.getByRole("heading", { name: "Cadeira flexora" }),
  ).toBeVisible();
  await card.getByLabel("Set 1 reps").fill("12");
  await card.getByLabel("Set 1 weight").fill("40");
  await page.getByRole("heading", { name: "Lower 1" }).click();

  await expect(card.getByText("Saved")).toBeVisible();

  await page.reload();

  const refreshedCard = page.locator("article").first();

  await expect(refreshedCard.getByLabel("Set 1 reps")).toHaveValue("12");
  await expect(refreshedCard.getByLabel("Set 1 weight")).toHaveValue("40");
});
