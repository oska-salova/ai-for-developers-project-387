import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeetingsSkeleton } from "./meetings-skeleton";

describe("MeetingsSkeleton", () => {
  it("announces that the meetings are loading", () => {
    render(<MeetingsSkeleton />);

    expect(screen.getByRole("status", { name: "Загрузка встреч" })).toBeInTheDocument();
  });
});
