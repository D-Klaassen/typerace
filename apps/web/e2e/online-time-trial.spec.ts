import { expect, test, type Browser, type Page } from "@playwright/test";

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

async function currentText(page: Page): Promise<string> {
  const text = page.locator("[data-typing-text]");
  await expect(text).toBeVisible({ timeout: 10_000 });

  return (await text.textContent()) ?? "";
}

test("an Online Time Trial until the slowest Player runs out of time", async ({
  browser,
}) => {
  // Bob's second Turn has to drain almost a full minute of Time Bank.
  test.setTimeout(150_000);
  const anna = await newPlayer(browser);
  const bob = await newPlayer(browser);

  await anna.goto("/online");
  await anna.getByRole("button", { name: "Create Room" }).click();
  await enterRoom(anna, "Anna");
  await expect(anna).toHaveURL(/\/room\/[A-Z]{6}$/);
  await bob.goto(anna.url());
  await enterRoom(bob, "Bob");
  await expect(anna.getByRole("list", { name: "Players" })).toContainText(
    "Bob",
  );

  await anna.getByText("Time Trial", { exact: true }).first().click();
  await anna.getByText("1", { exact: true }).click(); // 1-minute Time Bank
  await anna.getByRole("button", { name: "Start Match" }).click();

  // Anna's Turn: she types fast, Bob watches.
  await expect(anna.getByRole("heading", { name: "Your Turn" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(bob.getByRole("heading", { name: "Anna’s Turn" })).toBeVisible();
  await anna.keyboard.type(await currentText(anna));

  // Bob's Turn: slower than Anna, so he goes again afterwards.
  await expect(bob.getByRole("heading", { name: "Your Turn" })).toBeVisible();
  await bob.keyboard.type(await currentText(bob), { delay: 20 });

  await expect(bob.getByRole("heading", { name: "Your Turn" })).toBeVisible();
  await expect(anna.getByRole("heading", { name: "Bob’s Turn" })).toBeVisible();
  const text = await currentText(bob);
  await bob.keyboard.type(text.charAt(0));

  // His Time Bank runs dry on the Room's clock.
  await expect(anna.getByRole("heading", { name: "Anna wins!" })).toBeVisible({
    timeout: 70_000,
  });
  await expect(bob.getByRole("heading", { name: "Anna wins!" })).toBeVisible();
  const rows = anna.getByRole("row");
  await expect(rows.nth(1)).toContainText("Anna");
  await expect(rows.nth(2)).toContainText("Bob");
  // Columns: #, Player, Best time, Turns, …
  await expect(rows.nth(2).getByRole("cell").nth(3)).toHaveText("2");
});
