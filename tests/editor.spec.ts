import { expect, test } from "@playwright/test";

test("single user entering content", async ({ page }) => {
  await page.goto("/");
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
  // wait for navigation to doc handle url
  await pageOne.waitForURL(/#/);

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
