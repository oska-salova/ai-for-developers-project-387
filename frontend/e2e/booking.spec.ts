import { expect, test, type Locator } from "@playwright/test";

/** The date part of a day button's `YYYY-MM-DD, свободных слотов: N` label. */
function dayDate(label: string | null): string {
  const date = label?.split(",")[0];

  if (date === undefined) {
    throw new Error(`Day button has no date in its label: ${label ?? "null"}`);
  }

  return date;
}

/** The first slot the server left available in the selected day's grid. */
async function firstAvailableSlot(slots: Locator): Promise<Locator> {
  const buttons = slots.getByRole("button");
  const count = await buttons.count();

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);

    if (await button.isEnabled()) {
      return button;
    }
  }

  throw new Error("The selected day has no available slot");
}

test("owner creates a type, a guest books a slot and the owner sees the meeting", async ({
  page,
}) => {
  // Unique on every run, so the scenario does not depend on earlier state.
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const typeName = `E2E звонок ${runId}`;
  const guestName = `Гость ${runId}`;
  const guestEmail = `guest-${runId}@example.com`;

  // 1. The owner creates a unique meeting type; the default duration is 30.
  await page.goto("/meeting-types");
  await page.getByLabel("Название", { exact: true }).fill(typeName);
  await page.getByRole("button", { name: "Создать тип встречи" }).click();

  await expect(page.getByText("Тип встречи создан")).toBeVisible();
  const typeCard = page.getByRole("main").getByRole("listitem").filter({ hasText: typeName });
  await expect(typeCard).toHaveCount(1);
  await expect(typeCard).toContainText("30 мин");

  // 2. The guest picks that type and gets the whole 14-day calendar.
  await page.goto("/booking");
  await page.getByRole("button").filter({ hasText: typeName }).click();
  await page.getByRole("button", { name: "Далее" }).click();

  await expect(page.getByRole("heading", { name: "Выберите день и время" })).toBeVisible();
  const days = page.getByRole("group", { name: "Дни записи" });
  const dayButtons = days.getByRole("button");
  await expect(dayButtons).toHaveCount(14);

  for (let index = 0; index < 14; index += 1) {
    await expect(dayButtons.nth(index)).toHaveAttribute(
      "aria-label",
      /^\d{4}-\d{2}-\d{2}, свободных слотов: \d+$/u,
    );
  }

  // The wizard preselects the first day with free slots, so its first enabled
  // button is the first slot the server offers in the window.
  const selectedDay = days.locator('button[aria-pressed="true"]');
  await expect(selectedDay).toHaveCount(1);
  const date = dayDate(await selectedDay.getAttribute("aria-label"));

  const slots = page.getByRole("group", { name: "Слоты дня" });
  await expect(slots).toBeVisible();
  const slot = await firstAvailableSlot(slots);
  const time = (await slot.textContent())?.trim() ?? "";

  expect(time).toMatch(/^\d{2}:\d{2}$/u);

  // 3. The guest takes the slot, enters their details and confirms.
  await slot.click();
  await page.getByRole("button", { name: "Далее" }).click();

  await expect(page.getByRole("heading", { name: "Укажите имя и почту" })).toBeVisible();
  await page.getByLabel("Имя", { exact: true }).fill(guestName);
  await page.getByLabel("Почта", { exact: true }).fill(guestEmail);
  await page.getByRole("button", { name: "Далее" }).click();

  await expect(page.getByRole("heading", { name: "Проверьте запись" })).toBeVisible();
  const review = page.getByRole("region", { name: "Запись гостя" });
  await expect(review).toContainText(typeName);
  await expect(review).toContainText(time);
  await expect(review).toContainText(guestName);
  await expect(review).toContainText(guestEmail);

  await page.getByRole("button", { name: "Подтвердить запись" }).click();

  // 4. The confirmation screen repeats the type, the moment, the name and the email.
  await expect(page.getByRole("heading", { name: "Вы записаны" })).toBeVisible();
  const success = page.getByRole("region", { name: "Запись гостя" });
  await expect(success).toContainText(typeName);
  await expect(success).toContainText(time);
  await expect(success).toContainText(guestName);
  await expect(success).toContainText(guestEmail);

  // 5. "Book another" restarts the wizard, and the taken slot is now disabled.
  await page.getByRole("button", { name: "Записаться ещё" }).click();
  await page.getByRole("button").filter({ hasText: typeName }).click();
  await page.getByRole("button", { name: "Далее" }).click();

  const dayWithSlot = page
    .getByRole("group", { name: "Дни записи" })
    .getByRole("button", { name: new RegExp(`^${date}, `, "u") });
  await expect(dayWithSlot).toHaveCount(1);
  await dayWithSlot.click();

  const bookedSlot = page
    .getByRole("group", { name: "Слоты дня" })
    .getByRole("button", { name: time, exact: true });
  await expect(bookedSlot).toBeVisible();
  await expect(bookedSlot).toBeDisabled();

  // 6. The owner sees the meeting with the same type, time, name and email.
  await page.goto("/meetings");
  const meeting = page.getByRole("main").getByRole("listitem").filter({ hasText: guestName });
  await expect(meeting).toHaveCount(1);
  await expect(meeting).toContainText(typeName);
  await expect(meeting).toContainText(time);
  await expect(meeting.getByRole("link", { name: guestEmail })).toHaveAttribute(
    "href",
    `mailto:${guestEmail}`,
  );
});
