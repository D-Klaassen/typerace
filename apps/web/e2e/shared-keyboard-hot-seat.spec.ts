import { expect, test, type Page } from "@playwright/test";

async function typeCurrentText(page: Page, { pauseAfterFirstKeyMs = 0 }) {
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
  await page.clock.runFor(pauseAfterFirstKeyMs);
  await page.keyboard.type(text.slice(1));
}

test("two Players play a Hot Seat Match until one runs out of time", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/play");

  await expect(page.getByPlaceholder("Player 1")).toHaveAccessibleDescription(
    "Nicknames are shown on the leaderboard after a Hot Seat Match or a solo Medium race with Words or Sentences.",
  );
  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByRole("button", { name: "Add player" }).click();
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByText("Hot Seat", { exact: true }).click();
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

  // Gibberish, the default text, is for practising keys: it has no board.
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "See the leaderboard" }),
  ).toHaveCount(0);
});

test("rejects duplicate nicknames", async ({ page }) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Bob");

  await page.getByRole("button", { name: "Add player" }).click();
  await page.getByPlaceholder("Player 2").fill("bob");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Two Players can't share" }),
  ).toBeVisible();
});
