import { expect, test } from "@playwright/test";

test("a Classic Race can use Dutch sentences instead of Gibberish", async ({
  page,
}) => {
  await page.goto("/play");

  await page.getByPlaceholder("Player 1").fill("Anna");
  await page.getByPlaceholder("Player 2").fill("Bob");
  await expect(page.getByTestId("key-set-sample")).toBeVisible();

  await page.getByText("Sentences", { exact: true }).click();
  await page.getByText("Dutch", { exact: true }).click();
  // Real text ignores the Key Set, so its picker goes away.
  await expect(page.getByTestId("key-set-sample")).toBeHidden();
  await expect(page.getByTestId("text-sample")).toContainText(/[A-Z].*\./);

  await page.getByText("Short", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();

  for (const name of ["Anna", "Bob"]) {
    await expect(
      page.getByRole("heading", { name: `${name}'s turn` }),
    ).toBeVisible();
    await page.keyboard.press("Space");
    const text = (await page.locator("[data-typing-text]").textContent()) ?? "";
    expect(text).toMatch(/^[A-Z].*[.?!]$/);
    await page.keyboard.type(text);
  }

  await expect(page.getByRole("heading", { name: /wins!$/ })).toBeVisible();
});
