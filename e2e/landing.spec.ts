import { expect, test } from "@playwright/test";

test("landing page boots and shows the product promise", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Virtual Gallery").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your gallery/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /try pro hall/i }).first()).toBeVisible();
});
