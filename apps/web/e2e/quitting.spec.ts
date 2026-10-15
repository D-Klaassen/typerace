import { expect, test, type Browser, type Page } from "@playwright/test";

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

test("quitting a Shared Keyboard game asks first, then goes to the menu", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(
    page.getByRole("heading", { name: "Anna's turn" }),
  ).toBeVisible();

  // Changing your mind keeps the game as it was.
  await page.getByRole("button", { name: "Quit game" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Quit this game?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep playing" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Anna's turn" }),
  ).toBeVisible();

  await page.keyboard.press("Space");
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  // Words have at least two letters, so neither keystroke here is a Space,
  // which would press the dialog's focused button.
  await page.keyboard.type(text.charAt(0));
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();

  // Keystrokes go to the open dialog, not to the Turn behind it.
  await page.getByRole("button", { name: "Quit game" }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.type(text.charAt(1));
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();

  await dialog.getByRole("button", { name: "Quit game" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Typerace" })).toBeVisible();
});

test("leaving a Room mid-Match counts as leaving it", async ({ browser }) => {
  const anna = await newPlayer(browser);
  const bob = await newPlayer(browser);
  const cas = await newPlayer(browser);

  await anna.goto("/online");
  await anna.getByRole("button", { name: "Create Room" }).click();
  await enterRoom(anna, "Anna");
  await expect(anna).toHaveURL(/\/room\/[A-Z]{6}$/);
  for (const [page, nickname] of [
    [bob, "Bob"],
    [cas, "Cas"],
  ] as const) {
    await page.goto(anna.url());
    await enterRoom(page, nickname);
  }
  const players = anna.getByRole("list", { name: "Players" });
  await expect(players).toContainText("Cas");

  // In the lobby, leaving needs no confirmation.
  await cas.getByRole("button", { name: "Leave Room" }).click();
  await expect(cas).toHaveURL(/\/$/);
  await expect(players).not.toContainText("Cas");

  await anna.getByText("Crazy Darts", { exact: true }).click();
  await anna.getByRole("button", { name: "Start Match" }).click();
  await expect(bob.getByRole("list", { name: "HP" })).toBeVisible({
    timeout: 10_000,
  });

  // Mid-Match, Bob is told what leaving costs him before he goes.
  await bob.getByRole("button", { name: "Leave Room" }).click();
  const dialog = bob.getByRole("alertdialog", { name: "Leave this Match?" });
  await expect(dialog).toContainText("count as out");
  await dialog.getByRole("button", { name: "Leave Room" }).click();
  await expect(bob).toHaveURL(/\/$/);

  // With Bob out, Anna is the last Player with HP left.
  await expect(anna.getByRole("heading", { name: "Anna wins!" })).toBeVisible();
});

for (const path of ["/online", "/leaderboard", "/room/ZZZZZZ"]) {
  test(`${path} has a way back to the menu`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("link", { name: "Back to menu" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Typerace" })).toBeVisible();
  });
}
