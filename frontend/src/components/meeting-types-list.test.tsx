import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MeetingType } from "@/lib/api";
import { MeetingTypesList } from "./meeting-types-list";

const coffee: MeetingType = {
  id: "1",
  name: "Кофе с гостем",
  description: "Короткий разговор о задаче и знакомство",
  durationMinutes: 30,
};

const project: MeetingType = {
  id: "2",
  name: "Созвон по проекту",
  description: "",
  durationMinutes: 60,
};

describe("MeetingTypesList", () => {
  it("shows the name, the duration badge and the description of a meeting type", () => {
    render(<MeetingTypesList meetingTypes={[coffee]} />);

    expect(screen.getByText("Кофе с гостем")).toBeInTheDocument();
    expect(screen.getByText("30 мин")).toBeInTheDocument();
    expect(screen.getByText("Короткий разговор о задаче и знакомство")).toBeInTheDocument();
  });

  it("keeps the received order, so the newest type stays on top", () => {
    render(<MeetingTypesList meetingTypes={[project, coffee]} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Созвон по проекту");
    expect(items[1]).toHaveTextContent("Кофе с гостем");
  });

  it("does not render an empty description as a paragraph", () => {
    render(<MeetingTypesList meetingTypes={[project]} />);

    expect(screen.getByRole("listitem")).not.toHaveTextContent(
      "Короткий разговор о задаче и знакомство",
    );
    expect(screen.getByRole("listitem").querySelector("p")).toBeNull();
  });

  it("shows the empty state when the owner has no meeting types", () => {
    render(<MeetingTypesList meetingTypes={[]} />);

    expect(screen.getByText("Типов встреч пока нет")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
