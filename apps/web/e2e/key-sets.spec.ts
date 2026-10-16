import { expect, test } from "@playwright/test";

test("a custom Key Set only uses the keys clicked on the keyboard", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByRole("button", { name: "Add player" }).click();
  await page.getByPlaceholder("Player 2").fill("Bob");

  const keySetGroups = page.getByRole("group", { name: "Keys" });
  await keySetGroups.getByText("Custom", { exact: true }).click();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "at least 2 keys" }),
  ).toBeVisible();

  const keyboard = page.getByRole("group", { name: "Keys to practise" });
  await keyboard.getByRole("button", { name: "f", exact: true }).click();
  await keyboard.getByRole("button", { name: "j", exact: true }).click();
  await expect(
    keyboard.getByRole("button", { name: "j", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("key-set-sample")).toContainText(
    /^Sample: [fj ]+$/,
  );

  await page.getByRole("button", { name: "Start" }).click();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-typing-text]")).toHaveText(/^[fj ]+$/);
});

test("a Lesson preset with Capitals", async ({ page }) => {
  await page.goto("/play");
  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByRole("button", { name: "Add player" }).click();
  await page.getByPlaceholder("Player 2").fill("Bob");

  await page
    .getByRole("group", { name: "Keys" })
    .getByText("Lessons", { exact: true })
    .click();
  await page.getByLabel("Lesson", { exact: true }).selectOption("lesson-11");
  await page.getByText("Capitals (practise Shift)").click();
  await expect(page.getByTestId("key-set-sample")).toContainText(
    /^Sample: [ruRU ]+$/,
  );

  await page.getByRole("button", { name: "Start" }).click();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-typing-text]")).toHaveText(/^[ruRU ]+$/);
});
