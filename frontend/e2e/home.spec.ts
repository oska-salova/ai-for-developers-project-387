import { expect, test } from "@playwright/test";

test("home page explains the service and its three steps", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Календарь звонков" })).toBeVisible();
  await expect(
    page.getByText("Выберите тип встречи и запишитесь на свободное время в ближайшие две недели"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Как это работает" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
    "Выберите тип встречи",
    "Выберите свободное время",
    "Укажите имя и почту и подтвердите запись",
  ]);
  await expect(page.getByRole("contentinfo")).toContainText(/Календарь звонков, \d{4}/);
});

test("the booking button in the hero opens the booking section", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("main").getByRole("link", { name: "Записаться" }).click();

  await expect(page).toHaveURL("/booking");
  await expect(page.getByRole("heading", { level: 1, name: "Запись на встречу" })).toBeVisible();
});

test("header keeps every link visible on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Основная навигация" });
  for (const name of ["Типы встреч", "Встречи", "Записаться"]) {
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  }
});

test("header links reach their sections", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Основная навигация" });

  await navigation.getByRole("link", { name: "Типы встреч" }).click();
  await expect(page).toHaveURL("/meeting-types");
  await expect(page.getByRole("heading", { level: 1, name: "Типы встреч" })).toBeVisible();

  await navigation.getByRole("link", { name: "Встречи" }).click();
  await expect(page).toHaveURL("/meetings");
  await expect(page.getByRole("heading", { level: 1, name: "Встречи" })).toBeVisible();

  await navigation.getByRole("link", { name: "Записаться" }).click();
  await expect(page).toHaveURL("/booking");
  await expect(page.getByRole("heading", { level: 1, name: "Запись на встречу" })).toBeVisible();

  await page.getByRole("link", { name: "Календарь" }).click();
  await expect(page).toHaveURL("/");
});
