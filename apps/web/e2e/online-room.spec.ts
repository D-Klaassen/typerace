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

  // Anna's Key Set reaches Bob live.
  await anna
    .getByRole("group", { name: "Keys" })
    .getByText("Lessons", { exact: true })
    .click();
  await anna.getByLabel("Lesson", { exact: true }).selectOption("lesson-14");
  await expect(bob.getByText("Keys: Lesson 14 · q p")).toBeVisible();
  await expect(bob.getByTestId("key-set-sample")).toContainText(
    /^Sample: [qp ]+$/,
  );

  // Bob's Votes reach Anna as counts.
  await bob
    .getByRole("region", { name: "Your Vote" })
    .getByRole("group", { name: "Mode" })
    .getByText("Crazy Darts")
    .click();
  await expect(
    anna.getByRole("group", { name: "Mode" }).getByText("Crazy Darts"),
  ).toContainText("1");

  await bob.getByLabel("Vote for the keys").selectOption("row-top");
  await anna
    .getByRole("group", { name: "Keys" })
    .getByText("Rows", { exact: true })
    .click();
  await expect(
    anna.getByRole("group", { name: "Rows" }).getByText(/^Top row/),
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
