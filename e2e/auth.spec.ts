import { expect, test } from "@playwright/test";

const DEMO_EMAIL = "demo@virtualgallery.dev";
const DEMO_PASSWORD = "Demo1234!";

test.describe("sign-in hydration + password login", () => {
  test("form is interactive (not stuck on Loading) and email/password works", async ({
    page,
  }) => {
    await page.goto("/sign-in?force=1");

    const submit = page.getByRole("button", { name: /^sign in$/i });
    await expect(submit).toBeVisible({ timeout: 15_000 });
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("button", { name: /^loading/i })).toHaveCount(0);

    const email = page.locator("#email");
    const password = page.locator("#password");
    await expect(email).toBeEnabled();
    await expect(password).toBeEnabled();

    await email.fill(DEMO_EMAIL);
    await password.fill(DEMO_PASSWORD);
    await submit.click();

    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, {
      timeout: 30_000,
    });
  });
});
