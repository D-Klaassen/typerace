import { expect, test } from "@playwright/test";

test("shows the Finger Guide only for Players who switched it on", async ({
  page,
}) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByRole("checkbox", { name: "Finger Guide for Anna" }).click();
  await page.getByText("Hard", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  // Anna's Turn: the guide points at the key for the first character.
  await page.keyboard.press("Space");
  const guide = page.getByTestId("finger-guide");
  await expect(guide).toBeVisible();

  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  // Hard text starts with a letter or digit; a capital also lights up Shift.
  await expect(
    guide.locator("[data-key][data-active]").first(),
  ).toHaveAttribute("data-key", text.charAt(0).toLowerCase());

  await page.keyboard.type(text);

  // Bob's Turn: no guide.
  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-typing-text]")).toBeVisible();
  await expect(guide).toHaveCount(0);
});
