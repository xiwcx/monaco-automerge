import { expect, test } from "@playwright/test";

test("single user entering content", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Create New Doc").click();
  await page.waitForURL(/doc/);
  await page.getByRole("textbox").pressSequentially('const foo = "bar";\n');

  await expect(await page.getByRole("presentation")).toHaveText(
    'const foo = "bar";\n',
  );

  await page.getByRole("textbox").press("Backspace");
  await page.getByRole("textbox").press("Backspace");
  await page.getByRole("textbox").press("Backspace");

  await expect(await page.getByRole("presentation")).toHaveText(
    'const foo = "bar',
  );
});

test("multiple users entering content", async ({ context }) => {
  const pageOne = await context.newPage();
  const pageTwo = await context.newPage();

  await pageOne.goto("/");
  await pageOne.getByText("Create New Doc").click();
  await pageOne.waitForURL(/doc/);

  const url = pageOne.url();

  await pageTwo.goto(url);

  await expect(await pageTwo.getByRole("presentation")).toHaveText("");

  await pageOne.getByRole("textbox").pressSequentially('const foo = "bar";\n');

  await expect(await pageTwo.getByRole("presentation")).toHaveText(
    'const foo = "bar";\n',
  );

  await pageTwo.getByRole("textbox").press("Backspace");
  await pageTwo.getByRole("textbox").press("Backspace");
  await pageTwo.getByRole("textbox").press("Backspace");

  await expect(await pageOne.getByRole("presentation")).toHaveText(
    'const foo = "bar',
  );
});

test("multi-cursor appears, moves, and disappears", async ({
  browser,
  page: pageOne,
}) => {
  test.slow();

  await pageOne.clock.install();

  await pageOne.goto("/");
  await pageOne.getByText("Create New Doc").click();
  await pageOne.waitForURL(/doc/);

  const url = pageOne.url();

  await pageOne.getByRole("textbox").pressSequentially("// testing");

  await expect(await pageOne.locator(".peer-cursor")).not.toBeVisible();

  const contextTwo = await browser.newContext();
  const pageTwo = await contextTwo.newPage();
  await pageTwo.goto(url);

  await expect(await pageTwo.locator(".view-lines")).toHaveText("// testing");

  await pageTwo.getByRole("textbox").press("ArrowRight");

  // appears
  await expect(await pageOne.locator(".peer-cursor")).toBeVisible();

  const initialPosition = await pageOne.locator(".peer-cursor").boundingBox();

  await pageTwo.getByRole("textbox").press("ArrowRight");

  const finalPosition = await pageOne.locator(".peer-cursor").boundingBox();

  // moves
  expect(finalPosition).not.toEqual(initialPosition);

  contextTwo.close();

  await pageOne.clock.runFor(61 * 1000);

  // disappears
  await expect(await pageOne.locator(".peer-cursor")).not.toBeVisible();
});
