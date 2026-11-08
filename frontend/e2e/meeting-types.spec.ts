import { expect, test } from "@playwright/test";

test("owner sees the default meeting type the server starts with", async ({ page }) => {
  await page.goto("/meeting-types");

  await expect(page.getByRole("heading", { level: 1, name: "Типы встреч" })).toBeVisible();

  // The spec runs in parallel with others that create meeting types against the
  // same backend, so the total count is not observable here; that the seed adds
  // exactly one type is covered by the backend test.
  const item = page.getByRole("main").getByRole("listitem").filter({ hasText: "Знакомство" });
  await expect(item).toHaveCount(1);
  await expect(item).toContainText("30 мин");
  await expect(item).toContainText("Познакомимся и обсудим, чем я могу помочь.");
  await expect(page.getByText("Типов встреч пока нет")).toHaveCount(0);
});
