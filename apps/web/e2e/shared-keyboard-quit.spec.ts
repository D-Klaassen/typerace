import { expect, test, type Page } from "@playwright/test";

async function startTurn(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Play on a Shared Keyboard" }).click();

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(
    page.getByRole("heading", { name: "Anna's turn" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
}

async function expectSetup(page: Page) {
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  await expect(page.locator("[data-typing-text]")).toHaveCount(0);
}

test("leaving a Shared Keyboard game and coming back starts at setup", async ({
  page,
}) => {
  await startTurn(page);

  await page.goBack();
  await page.getByRole("link", { name: "Play on a Shared Keyboard" }).click();

  await expectSetup(page);
  await expect(page.getByPlaceholder("Player 1")).toHaveValue("Anna");
});

test("going back and forward to a Shared Keyboard game starts at setup", async ({
  page,
}) => {
  await startTurn(page);

  await page.goBack();
  await expect(
    page.getByRole("link", { name: "Play on a Shared Keyboard" }),
  ).toBeVisible();
  await page.goForward();

  await expectSetup(page);
});
