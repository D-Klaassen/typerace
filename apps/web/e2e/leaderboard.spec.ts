import { expect, test, type Page } from "@playwright/test";

test("the Leaderboard shows a board per Key Set, linked from home", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Leaderboard" }).click();

  await expect(
    page.getByRole("heading", { name: "Leaderboard" }),
  ).toBeVisible();
  // A board nobody has played yet: the pinkies with Capitals.
  await page
    .getByRole("group", { name: "Keys" })
    .getByText("Fingers", { exact: true })
    .click();
  await page.getByText("Pinkies", { exact: true }).click();
  await page.getByText("Capitals (practise Shift)").click();

  await expect(page).toHaveURL(/preset=finger-pinky&capitals=true$/);
  await expect(
    page.getByText("No times on this board yet.", { exact: false }),
  ).toBeVisible();
});

async function typeTurnTaking(page: Page, ms: number) {
  await page.keyboard.press("Space");
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  await page.keyboard.type(text.charAt(0));
  await page.clock.runFor(ms);
  await page.keyboard.type(text.slice(1));
}

test("a Hot Seat Match with Dutch Words goes on the Dutch Words board", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anke");
  await page.getByPlaceholder("Player 2").fill("Bram");
  await page.getByText("Hot Seat", { exact: true }).click();
  await page.getByText("1", { exact: true }).click(); // 1-minute Time Bank
  await page.getByText("Words", { exact: true }).click();
  await page.getByText("Dutch", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  // Anke takes 10 s, Bram 20 s; then Bram runs out of time.
  await typeTurnTaking(page, 10_000);
  await typeTurnTaking(page, 20_000);
  await page.keyboard.press("Space");
  await page.keyboard.type("x");
  await page.clock.runFor(41_000);

  await expect(page.getByRole("heading", { name: "Anke wins!" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "The best times are on the leaderboard.",
  );
  await page.getByRole("link", { name: "See the leaderboard" }).click();

  await expect(page).toHaveURL(/\/leaderboard\?source=words&language=nl$/);
  await expect(page.getByRole("radio", { name: "Words" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Dutch" })).toBeChecked();
  // Real text has no Key Set, so there is no picker for one.
  await expect(page.getByRole("group", { name: "Keys" })).toBeHidden();
  const board = page.getByRole("table", { name: "Leaderboard" });
  await expect(board).toContainText("Anke");
  await expect(board).toContainText("Bram");

  // English Words have a board of their own, which no test plays on. The
  // hidden /play page, kept by Next.js, has the same options.
  await page
    .getByText("English", { exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/source=words&language=en$/);
  await expect(
    page.getByText("No times on this board yet.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Anke" })).toHaveCount(0);

  // And Gibberish goes back to a board per Key Set.
  await page
    .getByText("Gibberish", { exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/leaderboard\?preset=classic-medium$/);
  await expect(page.getByRole("group", { name: "Keys" })).toBeVisible();
});
