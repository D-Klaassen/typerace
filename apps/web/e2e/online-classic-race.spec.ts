import { expect, test, type Browser, type Page } from "@playwright/test";

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

async function typeWholeText(page: Page) {
  const text = page.locator("[data-typing-text]");
  await expect(text).toBeVisible({ timeout: 10_000 });
  await page.keyboard.type((await text.textContent()) ?? "");
}

test("an Online Classic Race with a Spectator and a Rematch", async ({
  browser,
}) => {
  const anna = await newPlayer(browser);
  const bob = await newPlayer(browser);
  const cas = await newPlayer(browser);

  await anna.goto("/online");
  await anna.getByRole("button", { name: "Create Room" }).click();
  await enterRoom(anna, "Anna");
  await expect(anna).toHaveURL(/\/room\/[A-Z]{6}$/);
  const roomUrl = anna.url();

  await bob.goto(roomUrl);
  await enterRoom(bob, "Bob");
  await expect(anna.getByRole("list", { name: "Players" })).toContainText(
    "Bob",
  );

  await anna.getByText("Short", { exact: true }).click();
  await anna.getByRole("button", { name: "Start Match" }).click();
  await expect(bob.getByText("Get ready…")).toBeVisible();

  // Bob finishes first; Cas arrives mid-race and watches.
  await typeWholeText(bob);
  await expect(
    bob.getByText("Finished! Waiting for the others…"),
  ).toBeVisible();

  await cas.goto(roomUrl);
  await enterRoom(cas, "Cas");
  await expect(cas.getByText("You’ll play in the next one.")).toBeVisible();
  await expect(cas.getByRole("list", { name: "Race progress" })).toContainText(
    "Bob",
  );

  await typeWholeText(anna);

  for (const page of [anna, bob, cas]) {
    await expect(
      page.getByRole("heading", { name: "Bob wins!" }),
    ).toBeVisible();
  }
  const rows = anna.getByRole("row");
  await expect(rows.nth(1)).toContainText("Bob");
  await expect(rows.nth(2)).toContainText("Anna");

  // Rematch: everyone, Cas included, is back in the lobby as a Player.
  await expect(bob.getByText("Waiting for the Host to go back")).toBeVisible();
  await anna.getByRole("button", { name: "Back to lobby" }).click();
  await expect(cas.getByText("Waiting for the Host to start")).toBeVisible();
  await expect(anna.getByRole("list", { name: "Players" })).toContainText(
    "Cas",
  );
});
