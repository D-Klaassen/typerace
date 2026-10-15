import { expect, test } from "@playwright/test";

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
    page.getByText("No times for these keys yet.", { exact: false }),
  ).toBeVisible();
});
