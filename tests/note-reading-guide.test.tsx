import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NoteReadingGuide } from "@/components/vault/NoteReadingGuide";

afterEach(() => vi.restoreAllMocks());

describe("note reading guide", () => {
  it("provides unique chapter anchors and leaves native navigation intact", async () => {
    const { container } = render(
      <NoteReadingGuide contentKey="chapters">
        <h2>Next action</h2><p>First section</p><h2>Next action</h2><p>Second section</p>
      </NoteReadingGuide>,
    );
    await waitFor(() => expect(container.querySelectorAll(".note-reading-menu a")).toHaveLength(2));
    const links = container.querySelectorAll<HTMLAnchorElement>(".note-reading-menu a");
    expect(links[0].hash).toBe("#note-next-action");
    expect(links[1].hash).toBe("#note-next-action-2");
    const menu = container.querySelector("details")!;
    menu.open = true;
    expect(fireEvent.click(links[1])).toBe(true); // no preventDefault / scroll hijack
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(container.querySelectorAll("h2")[1]);
  });

  it("tracks the visible section on native scroll and removes listeners on unmount", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { container, unmount } = render(
      <NoteReadingGuide contentKey="scroll"><h2>First</h2><h2>Second</h2></NoteReadingGuide>,
    );
    await waitFor(() => expect(container.querySelectorAll(".note-reading-menu a")).toHaveLength(2));
    const headings = container.querySelectorAll("h2");
    vi.spyOn(headings[0], "getBoundingClientRect").mockReturnValue({ top: -200 } as DOMRect);
    vi.spyOn(headings[1], "getBoundingClientRect").mockReturnValue({ top: 400 } as DOMRect);
    act(() => window.dispatchEvent(new Event("scroll")));
    await waitFor(() => expect(container.querySelector('[aria-current="location"]')).toHaveTextContent("First"));
    vi.spyOn(headings[1], "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    act(() => window.dispatchEvent(new Event("scroll")));
    await waitFor(() => expect(container.querySelector('[aria-current="location"]')).toHaveTextContent("Second"));
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("keeps short notes readable without adding a navigation bar", async () => {
    render(<NoteReadingGuide contentKey="short"><h2>Only section</h2><p>Keep this visible.</p></NoteReadingGuide>);
    await waitFor(() => expect(screen.getByRole("heading")).toHaveAttribute("id", "note-only-section"));
    expect(screen.queryByText("On this page")).toBeNull();
    expect(screen.getByText("Keep this visible.")).toBeVisible();
  });
});
