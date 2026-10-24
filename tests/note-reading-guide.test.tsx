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

  it("does not duplicate the Back to top anchor when a chapter is named Reader start", async () => {
    const { container } = render(
      <NoteReadingGuide contentKey="start"><h2>Reader start</h2><h2>Next chapter</h2></NoteReadingGuide>,
    );
    await waitFor(() => expect(container.querySelectorAll(".note-reading-menu a")).toHaveLength(2));
    expect(container.querySelectorAll("#note-reader-start")).toHaveLength(1);
    expect(container.querySelector("h2")?.id).toBe("note-reader-start-2");
    expect(container.querySelector(".note-reading-menu a")?.getAttribute("href")).toBe("#note-reader-start-2");
  });

  it("tracks the native anchor offset on a short viewport", async () => {
    vi.stubGlobal("innerHeight", 240);
    try {
      const { container } = render(
        <NoteReadingGuide contentKey="short-viewport"><h2>First</h2><h2>Second</h2></NoteReadingGuide>,
      );
      await waitFor(() => expect(container.querySelectorAll(".note-reading-menu a")).toHaveLength(2));
      const headings = container.querySelectorAll("h2");
      headings[0].style.scrollMarginTop = "172px";
      vi.spyOn(headings[0], "getBoundingClientRect").mockReturnValue({ top: -200 } as DOMRect);
      vi.spyOn(headings[1], "getBoundingClientRect").mockReturnValue({ top: 150 } as DOMRect);
      act(() => window.dispatchEvent(new Event("scroll")));
      await waitFor(() => expect(container.querySelector('[aria-current="location"]')).toHaveTextContent("Second"));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    { position: "below", top: 70, bottom: 140, height: "126px" },
    { position: "above", top: 180, bottom: 250, height: "166px" },
  ])("limits the $position menu using the guide's containing block", async ({ position, top, bottom, height }) => {
    vi.stubGlobal("innerHeight", 280);
    try {
      const { container } = render(
        <NoteReadingGuide contentKey="menu-space"><h2>First</h2><h2>Second</h2></NoteReadingGuide>,
      );
      await waitFor(() => expect(container.querySelector("details")).not.toBeNull());
      const menu = container.querySelector("details")!;
      const guide = container.querySelector(".note-reading-guide")!;
      vi.spyOn(guide, "getBoundingClientRect").mockReturnValue({ top, bottom } as DOMRect);
      vi.spyOn(menu, "getBoundingClientRect").mockReturnValue({ top: top + 11, bottom: bottom - 11 } as DOMRect);
      menu.open = true;
      fireEvent(menu, new Event("toggle"));
      expect(menu.dataset.menuPosition).toBe(position);
      expect(menu.style.getPropertyValue("--note-menu-max-height")).toBe(height);

      // Resize while open must recompute both placement and available height.
      vi.stubGlobal("innerHeight", 600);
      act(() => window.dispatchEvent(new Event("resize")));
      await waitFor(() => {
        expect(menu.dataset.menuPosition).toBe("below");
        expect(menu.style.getPropertyValue("--note-menu-max-height")).toBe(`${Math.min(360, 600 - bottom - 14)}px`);
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
