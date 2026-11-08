import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("explains the service and invites the guest to book", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Календарь звонков" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Выберите тип встречи и запишитесь на свободное время в ближайшие две недели",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Записаться" })).toHaveAttribute("href", "/booking");
  });

  it("shows the three steps of booking", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 2, name: "Как это работает" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Выберите тип встречи",
      "Выберите свободное время",
      "Укажите имя и почту и подтвердите запись",
    ]);
  });
});
