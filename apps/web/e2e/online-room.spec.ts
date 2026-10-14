import { expect, test, type Page } from "@playwright/test";

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

test("two Players share a Room, its settings and Votes", async ({
  browser,
}) => {
  const anna = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();

  // Anna creates a Room and becomes Host.
  await anna.goto("/online");
  await anna.getByRole("button", { name: "Create Room" }).click();
  await enterRoom(anna, "Anna");
  await expect(anna).toHaveURL(/\/room\/[A-Z]{6}$/);
  await expect(anna.getByText("You are the Host.")).toBeVisible();

  // Bob joins with the link.
  await bob.goto(anna.url());
  await enterRoom(bob, "Bob");
  const annaPlayers = anna.getByRole("list", { name: "Players" });
  await expect(annaPlayers).toContainText("Bob");
  await expect(bob.getByRole("list", { name: "Players" })).toContainText(
    "Anna",
  );

  // Anna's settings reach Bob live.
  await anna
    .getByRole("group", { name: "Difficulty" })
    .getByText("Hard")
    .click();
  const bobSettings = bob.getByRole("group", { name: "Difficulty" }).first();
  await expect(bobSettings.getByRole("radio", { name: "Hard" })).toBeChecked();

  // Bob's Vote reaches Anna as a count.
  await bob
    .getByRole("region", { name: "Your Vote" })
    .getByRole("group", { name: "Mode" })
    .getByText("Crazy Darts")
    .click();
  await expect(
    anna.getByRole("group", { name: "Mode" }).getByText("Crazy Darts"),
  ).toContainText("1");
});

test("a Room code nobody created is not found", async ({ page }) => {
  await page.goto("/room/ZZZZZZ");
  await page.getByLabel("Your nickname").fill("Cas");
  await page.getByRole("button", { name: "Enter Room" }).click();

  await expect(
    page.getByRole("heading", { name: "Room not found" }),
  ).toBeVisible();
});
