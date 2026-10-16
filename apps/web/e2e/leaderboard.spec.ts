import { expect, test, type Page } from "@playwright/test";

test("the Leaderboard has a board per Text Source, Language and Text Length, linked from home", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Leaderboard" }).click();

  await expect(
    page.getByRole("heading", { name: "Leaderboard" }),
  ).toBeVisible();
  // Gibberish is for practising keys, so it has no board.
  await expect(page.getByRole("radio", { name: "Words" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "English" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Gibberish" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Keys" })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Medium" })).toBeChecked();

  // A board nobody plays on: Dutch Sentences.
  await page.getByText("Sentences", { exact: true }).click();
  await page.getByText("Dutch", { exact: true }).click();
  await expect(page).toHaveURL(
    /\/leaderboard\?source=sentences&language=nl&length=medium$/,
  );
  await expect(
    page.getByText("No times on this board yet.", { exact: false }),
  ).toBeVisible();

  // Each Text Length has a board of its own.
  await page.getByText("Long", { exact: true }).click();
  await expect(page).toHaveURL(
    /\/leaderboard\?source=sentences&language=nl&length=long$/,
  );
  await expect(page.getByRole("radio", { name: "Dutch" })).toBeChecked();
  await expect(
    page.getByText("No times on this board yet.", { exact: false }),
  ).toBeVisible();
});

test("an old link to a Gibberish board opens English Words", async ({
  page,
}) => {
  await page.goto("/leaderboard?preset=classic-medium");

  await expect(page.getByRole("radio", { name: "Words" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "English" })).toBeChecked();
});

test("a link from before boards had a Text Length opens the Medium board", async ({
  page,
}) => {
  await page.goto("/leaderboard?source=sentences&language=nl");

  await expect(page.getByRole("radio", { name: "Sentences" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Dutch" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Medium" })).toBeChecked();
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

  await page.getByRole("button", { name: "Add player" }).click();
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

  // Hot Seat Turns are Medium texts, whatever a Classic Race's length is.
  await expect(page).toHaveURL(
    /\/leaderboard\?source=words&language=nl&length=medium$/,
  );
  await expect(page.getByRole("radio", { name: "Words" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Dutch" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Medium" })).toBeChecked();
  const board = page.getByRole("table", { name: "Leaderboard" });
  await expect(board).toContainText("Anke");
  await expect(board).toContainText("Bram");

  // Dutch Sentences have a board of their own, which no test plays on. The
  // hidden /play page, kept by Next.js, has the same options.
  await page
    .getByText("Sentences", { exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/source=sentences&language=nl&length=medium$/);
  await expect(
    page.getByText("No times on this board yet.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Anke" })).toHaveCount(0);
});
