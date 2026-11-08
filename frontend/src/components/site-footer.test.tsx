import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the service name and the year pinned at build time", () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_YEAR", "2026");

    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Календарь звонков");
    expect(footer).toHaveTextContent("2026");
  });
});
