import { expect, test } from "@playwright/test";

const shouldSkip =
  !process.env.PLAYWRIGHT_BASE_URL &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

test.skip(
  shouldSkip,
  "Set PLAYWRIGHT_BASE_URL or Clerk env vars to run e2e tests."
);

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /fundraising infrastructure/i,
    })
  ).toBeVisible();
});

test("admin redirects to sign-in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/sign-in/);
});
