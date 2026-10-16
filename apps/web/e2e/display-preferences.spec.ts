import { expect, test, type Browser, type Page } from "@playwright/test";

test("every Shared Keyboard Player gets the same aids", async ({ page }) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");

  await page.getByRole("button", { name: "Add player" }).click();
  await page.getByPlaceholder("Player 2").fill("Bob");
  // One set of switches for everyone: only the Finger Guide on at first, and
  // the preview shows it straight away.
  const keyboardSwitch = page.getByRole("checkbox", {
    name: "On-screen Keyboard",
  });
  const fingerGuideSwitch = page.getByRole("checkbox", {
    name: "Finger Guide",
  });
  const coloredTextSwitch = page.getByRole("checkbox", {
    name: "Coloured Text",
  });
  await expect(fingerGuideSwitch).toBeChecked();
  await expect(keyboardSwitch).not.toBeChecked();
  await expect(coloredTextSwitch).not.toBeChecked();
  await expect(coloredTextSwitch).toHaveAccessibleDescription(
    "Every character still to type is in the colour of the finger that types it.",
  );
  const preview = page.getByTestId("display-preview");
  await expect(preview.getByTestId("finger-guide")).toBeVisible();
  await expect(preview.locator("[data-typing-text] [data-finger]")).toHaveCount(
    0,
  );

  // Swap the hands for the keyboard and colour the text; the preview follows.
  await keyboardSwitch.click();
  await fingerGuideSwitch.click();
  await coloredTextSwitch.click();
  await expect(preview.getByTestId("on-screen-keyboard")).toBeVisible();
  await expect(preview.getByTestId("finger-guide")).toHaveCount(0);
  await expect(
    preview.locator("[data-typing-text] [data-finger]").first(),
  ).toBeVisible();

  await page
    .getByRole("group", { name: "Keys" })
    .getByText("Classic", { exact: true })
    .click();
  await page.getByText("Hard", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  // Anna's Turn: the keyboard, pointing at the first character's key, and
  // the text in finger colours.
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
  // A space is always typed with the thumbs.
  await expect(
    page.locator("[data-typing-text] [data-finger='thumbs']").first(),
  ).toHaveText(/^ +$/);
  await page.keyboard.type(text);

  // Bob's Turn: the same aids.
  await expect(page.getByRole("heading", { name: "Bob's turn" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("on-screen-keyboard")).toBeVisible();
  await expect(page.getByTestId("finger-guide")).toHaveCount(0);
  await expect(
    page.locator("[data-typing-text] [data-finger]").first(),
  ).toBeVisible();
  await page.keyboard.type(
    (await page.locator("[data-typing-text]").textContent()) ?? "",
  );

  // The results show which aids each Player had on.
  await expect(aidsOf(page, "Anna")).toHaveText(
    "On-screen KeyboardColoured Text",
  );
  await expect(aidsOf(page, "Bob")).toHaveText(
    "On-screen KeyboardColoured Text",
  );
});

/** The Aids cell (the last one) of a Player's results row. */
function aidsOf(page: Page, nickname: string) {
  return page
    .getByRole("row")
    .filter({ hasText: nickname })
    .getByRole("cell")
    .last();
}

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

  for (const page of [anna, bob]) {
    await page.keyboard.type(
      (await page.locator("[data-typing-text]").textContent()) ?? "",
    );
  }

  // Everyone sees everyone's aids in the results.
  for (const page of [anna, bob]) {
    await expect(aidsOf(page, "Anna")).toHaveText(
      "On-screen KeyboardFinger Guide",
    );
    await expect(aidsOf(page, "Bob")).toHaveText("Finger Guide");
  }
});
