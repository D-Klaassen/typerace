import { expect, test, type Page } from "@playwright/test";

async function typeTextTaking(page: Page, ms: number) {
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
  await page.clock.runFor(ms);
  await page.keyboard.type(text.slice(1));
}

test("the fastest Player wins a Classic Race on a Shared Keyboard", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByText("Classic Race", { exact: true }).click();
  await page.getByText("Short", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  await expect(
    page.getByRole("heading", { name: "Anna's turn" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  expect(
    (await page.locator("[data-typing-text]").textContent())?.length,
  ).toBeGreaterThanOrEqual(50);
  await typeTextTaking(page, 30_000);

  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  await typeTextTaking(page, 20_000);

  await expect(page.getByRole("heading", { name: "Bob wins!" })).toBeVisible();
  const rows = page.getByRole("row");
  await expect(rows.nth(1)).toContainText("Bob");
  // The fake clock jumps 20 s; real typing time adds a few milliseconds.
  await expect(rows.nth(1)).toContainText(/20\.\ds/);
  await expect(rows.nth(2)).toContainText("Anna");
  await expect(rows.nth(2)).toContainText(/30\.\ds/);
});
