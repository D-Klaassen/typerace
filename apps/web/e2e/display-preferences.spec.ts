import { expect, test, type Browser, type Page } from "@playwright/test";

test("each Shared Keyboard Player gets their own aids", async ({ page }) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  // Everyone starts with the Finger Guide on and the keyboard off.
  await expect(
    page.getByRole("checkbox", { name: "Finger Guide for Bob" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "On-screen Keyboard for Bob" }),
  ).not.toBeChecked();

  // Anna swaps the hands for the keyboard; the preview follows.
  await page
    .getByRole("checkbox", { name: "On-screen Keyboard for Anna" })
    .click();
  await page.getByRole("checkbox", { name: "Finger Guide for Anna" }).click();
  const preview = page.getByTestId("display-preview");
  await expect(page.getByText("Preview for Anna")).toBeVisible();
  await expect(preview.getByTestId("on-screen-keyboard")).toBeVisible();
  await expect(preview.getByTestId("finger-guide")).toHaveCount(0);

  await page
    .getByRole("group", { name: "Keys" })
    .getByText("Classic", { exact: true })
    .click();
  await page.getByText("Hard", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  // Anna's Turn: only the keyboard, pointing at the first character's key.
  await page.keyboard.press("Space");
  const keyboard = page.getByTestId("on-screen-keyboard");
  await expect(keyboard).toBeVisible();
  await expect(page.getByTestId("finger-guide")).toHaveCount(0);
  const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
  // Hard text starts with a letter or digit; a capital also lights up Shift.
  const firstKey = text.charAt(0).toLowerCase();
  await expect(keyboard.locator(`[data-key="${firstKey}"]`)).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.keyboard.type(text);

  // Bob's Turn: the default, only the hands.
  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("finger-guide")).toBeVisible();
  await expect(page.getByTestId("on-screen-keyboard")).toHaveCount(0);
});

async function newPlayer(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage();
}

async function enterRoom(page: Page, nickname: string) {
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Enter Room" }).click();
}

test("Online, your display is set in the lobby and used in the Match", async ({
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

  // The Finger Guide is on by default; Anna adds the keyboard.
  const preview = anna.getByTestId("display-preview");
  await expect(preview.getByTestId("finger-guide")).toBeVisible();
  await expect(preview.getByTestId("on-screen-keyboard")).toHaveCount(0);
  await anna.getByRole("checkbox", { name: "On-screen Keyboard" }).click();
  await expect(preview.getByTestId("on-screen-keyboard")).toBeVisible();
  await expect(preview.getByTestId("finger-guide")).toBeVisible();

  await anna.getByText("Short", { exact: true }).click();
  await anna.getByRole("button", { name: "Start Match" }).click();

  // In the race Anna has both aids and no switch; Bob kept the default.
  // Wait for the race itself: the lobby's preview shows the aids too.
  await expect(anna.getByRole("list", { name: "Race progress" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(anna.getByTestId("on-screen-keyboard")).toBeVisible();
  await expect(anna.getByTestId("finger-guide")).toBeVisible();
  await expect(anna.getByRole("checkbox")).toHaveCount(0);
  await expect(bob.getByRole("list", { name: "Race progress" })).toBeVisible();
  await expect(bob.getByTestId("finger-guide")).toBeVisible();
  await expect(bob.getByTestId("on-screen-keyboard")).toHaveCount(0);
});
