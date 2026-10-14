import { expect, test, type Page } from "@playwright/test";

async function typeCurrentText(page: Page, { pauseAfterFirstKeyMs = 0 }) {
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
  await page.clock.runFor(pauseAfterFirstKeyMs);
  await page.keyboard.type(text.slice(1));
}

test("two Players play a Time Trial until one runs out of time", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByText("1", { exact: true }).click(); // 1-minute Time Bank
  await page.getByRole("button", { name: "Start" }).click();

  // Opening round: Anna takes 10 s, Bob 20 s.
  await expect(
    page.getByRole("heading", { name: "Anna's turn" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await typeCurrentText(page, { pauseAfterFirstKeyMs: 10_000 });

  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  await typeCurrentText(page, { pauseAfterFirstKeyMs: 20_000 });

  // Bob is slowest, so he goes again, with 40 s left in his Time Bank.
  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
  await page.clock.runFor(41_000);

  await expect(page.getByRole("heading", { name: "Anna wins!" })).toBeVisible();
  const rows = page.getByRole("row");
  await expect(rows.nth(1)).toContainText("Anna");
  await expect(rows.nth(2)).toContainText("Bob");
});

test("rejects duplicate nicknames", async ({ page }) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Bob");
  await page.getByPlaceholder("Player 2").fill("bob");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Two Players can't share" }),
  ).toBeVisible();
});
