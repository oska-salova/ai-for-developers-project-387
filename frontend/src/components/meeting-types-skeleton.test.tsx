import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeetingTypesSkeleton } from "./meeting-types-skeleton";

describe("MeetingTypesSkeleton", () => {
  it("announces that the meeting types are loading", () => {
    render(<MeetingTypesSkeleton />);

    expect(screen.getByRole("status", { name: "Загрузка типов встреч" })).toBeInTheDocument();
  });
});
