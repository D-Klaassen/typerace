import { expect, test, type Browser, type Page } from "@playwright/test";

async function typingText(page: Page): Promise<string> {
  return (await page.locator("[data-typing-text]").textContent()) ?? "";
}

/** A key that isn't the next character of `text`. */
function wrongKeyFor(text: string, position: number): string {
  return text.charAt(position) === "x" ? "q" : "x";
}

test("a Shared Keyboard Player races a car round the circuit, and crashes on three Typos", async ({
  page,
}) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  // Off by default; Anna switches it on, and the preview shows the circuit.
  const racingTheme = page.getByRole("checkbox", { name: "Racing Theme" });
  await expect(racingTheme).not.toBeChecked();
  await racingTheme.click();
  await expect(
    page.getByTestId("display-preview").getByTestId("racing-track"),
  ).toBeVisible();

  await page.getByText("Short", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.keyboard.press("Space");

  await expect(page.getByRole("img", { name: "Race track" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "The whole circuit" }),
  ).toBeVisible();
  await expect(page.getByText("Lap 1/1")).toBeVisible();

  const text = await typingText(page);
  await page.keyboard.type(text.slice(0, 3));
  // One or two Typos only skid; the third in a row crashes until the right key.
  const crash = page.getByRole("status").filter({ hasText: "Crashed!" });
  for (let i = 0; i < 2; i++) {
    await page.keyboard.type(wrongKeyFor(text, 3));
  }
  await expect(crash).toHaveCount(0);
  await page.keyboard.type(wrongKeyFor(text, 3));
  await expect(crash).toHaveText("Crashed! Press the right key to drive on");

  await page.keyboard.type(text.charAt(3));
  await expect(crash).toHaveCount(0);
  await page.keyboard.type(text.slice(4));

  // The results don't count the Racing Theme as an aid.
  await expect(
    page.getByRole("row").filter({ hasText: "Anna" }).getByRole("cell").last(),
  ).toHaveText("Finger Guide");
});

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

test("Online, only the Players who switch it on see the race as cars", async ({
  browser,
}) => {
  const anna = await newPlayer(browser);
  const bob = await newPlayer(browser);

  await anna.goto("/online");
  await anna.getByRole("button", { name: "Create Room" }).click();
  await enterRoom(anna, "Anna");
  await expect(anna).toHaveURL(/\/room\/[A-Z]{6}$/);
  await bob.goto(anna.url());
  await enterRoom(bob, "Bob");

  await anna.getByRole("checkbox", { name: "Racing Theme" }).click();
  await anna.getByText("Short", { exact: true }).click();
  await anna.getByRole("button", { name: "Start Match" }).click();

  // Anna sees both cars and the race order; Bob keeps the progress bars.
  const order = anna.getByRole("list", { name: "Race order" });
  await expect(order).toBeVisible({ timeout: 10_000 });
  await expect(order).toContainText("You");
  await expect(order).toContainText("Bob");
  await expect(bob.getByRole("list", { name: "Race progress" })).toBeVisible();
  await expect(bob.getByTestId("racing-track")).toHaveCount(0);

  // Bob's crash reaches Anna's screen.
  const bobsText = await typingText(bob);
  for (let i = 0; i < 3; i++) {
    await bob.keyboard.type(wrongKeyFor(bobsText, 0));
  }
  await expect(
    order.getByRole("listitem").filter({ hasText: "Bob" }),
  ).toContainText("Crashed");

  for (const page of [anna, bob]) {
    await page.keyboard.type(await typingText(page));
  }
  await expect(anna.getByRole("heading", { name: /wins/ })).toBeVisible();
});
