import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("links the service name back to the home page", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Календарь" })).toHaveAttribute("href", "/");
  });

  it("exposes the guest and owner sections", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Типы встреч" })).toHaveAttribute(
      "href",
      "/meeting-types",
    );
    expect(screen.getByRole("link", { name: "Встречи" })).toHaveAttribute("href", "/meetings");
    expect(screen.getByRole("link", { name: "Записаться" })).toHaveAttribute("href", "/booking");
  });
});
