import { expect, test, type Browser, type Page } from "@playwright/test";

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

test("Crazy Darts: Anna's words knock Bob out", async ({ browser }) => {
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

  await anna.getByText("Crazy Darts", { exact: true }).click();
  const settings = (name: string) => anna.getByRole("group", { name });
  await settings("Starting HP").getByText("50", { exact: true }).click();
  await settings("Dart damage per character")
    .getByText("3", { exact: true })
    .click();
  await anna.getByRole("button", { name: "Start Match" }).click();

  // Every word Anna completes throws a Dart at Bob, the only opponent.
  // Wait for the board: the lobby's display preview also shows a text.
  await expect(anna.getByRole("list", { name: "HP" })).toBeVisible({
    timeout: 10_000,
  });
  const text = anna.locator("[data-typing-text]");
  const words = ((await text.textContent()) ?? "").split(" ");
  await anna.keyboard.type(`${words[0]} `);
  await expect(bob.getByRole("list", { name: "Latest Darts" })).toContainText(
    "Anna 🎯 Bob",
  );

  await anna.keyboard.type(words.slice(1, 20).join(" "));

  for (const page of [anna, bob]) {
    await expect(
      page.getByRole("heading", { name: "Anna wins!" }),
    ).toBeVisible();
  }
  const rows = anna.getByRole("row");
  await expect(rows.nth(1)).toContainText("Anna");
  // Columns: #, Player, HP left, …
  await expect(rows.nth(2).getByRole("cell").nth(1)).toHaveText("Bob");
  await expect(rows.nth(2).getByRole("cell").nth(2)).toHaveText("0");
});
