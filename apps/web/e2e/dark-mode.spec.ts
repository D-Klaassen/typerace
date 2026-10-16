import { expect, test } from "@playwright/test";

test("switching dark mode off sends a car to switch it back on", async ({
  page,
}) => {
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("switch", { name: "Dark mode" });
  const car = page.getByTestId("dark-mode-car");
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(toggle).toBeChecked();

  // Light mode, but only until the car gets there; the switch stays locked.
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeDisabled();
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(car).toBeVisible();

  await expect(toggle).toBeChecked({ timeout: 5_000 });
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(toggle).toBeDisabled();

  // Once the car has driven off, the switch works again.
  await expect(car).toHaveCount(0, { timeout: 5_000 });
  await expect(toggle).toBeEnabled();
});

test("with reduced motion, dark mode comes back without a car", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/play");
  const toggle = page.getByRole("switch", { name: "Dark mode" });

  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeChecked({ timeout: 3_000 });
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(toggle).toBeEnabled();
  await expect(page.getByTestId("dark-mode-car")).toHaveCount(0);
});
