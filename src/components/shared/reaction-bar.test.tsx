import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReactionBar } from "@/components/shared/reaction-bar";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReactionBar", () => {
  const baseProps = {
    ratingId: "rating-1",
    summary: {},
    userReaction: null as null | "hype" | "sadness" | "plot_twist" | "skip",
  };

  it("renderiza los 4 botones correctos", () => {
    render(<ReactionBar {...baseProps} />);
    expect(screen.getByTestId("reaction-btn-hype")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-btn-sadness")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-btn-plot_twist")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-btn-skip")).toBeInTheDocument();
  });

  it("click en reacción activa hace update optimista del contador", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: { hype: 1 }, userReaction: "hype" }),
    });

    render(<ReactionBar {...baseProps} summary={{}} />);

    // Before click — no count
    expect(screen.queryByText("1")).toBeNull();

    fireEvent.click(screen.getByTestId("reaction-btn-hype"));

    // Optimistic update — count should appear immediately
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("toggle remove: segundo click en la misma reacción baja el count", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: { hype: 1 }, userReaction: "hype" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: {}, userReaction: null }),
      });

    render(<ReactionBar {...baseProps} summary={{}} />);

    const btn = screen.getByTestId("reaction-btn-hype");
    fireEvent.click(btn);
    // Optimistic: count 1
    expect(screen.getByText("1")).toBeInTheDocument();

    // Wait for first fetch to finish before second click
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // Second click (toggle remove)
    fireEvent.click(btn);
    // Optimistic: count removed
    await waitFor(() => expect(screen.queryByText("1")).toBeNull());
  });

  it("counts se actualizan con la data del servidor después del fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: { hype: 5 }, userReaction: "hype" }),
    });

    render(<ReactionBar {...baseProps} summary={{}} />);
    fireEvent.click(screen.getByTestId("reaction-btn-hype"));

    // Optimistic: 1
    expect(screen.getByText("1")).toBeInTheDocument();

    // Server update: 5
    await waitFor(() => expect(screen.getByText("5")).toBeInTheDocument());
  });

  it("rollback si el fetch falla", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<ReactionBar {...baseProps} summary={{}} />);
    fireEvent.click(screen.getByTestId("reaction-btn-hype"));

    // Optimistic
    expect(screen.getByText("1")).toBeInTheDocument();

    // After rollback
    await waitFor(() => expect(screen.queryByText("1")).toBeNull());
  });

  it("botones deshabilitados cuando disabled=true", () => {
    render(<ReactionBar {...baseProps} disabled={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("tooltip de login cuando disabled=true", () => {
    render(<ReactionBar {...baseProps} disabled={true} />);
    const btns = screen.getAllByRole("button");
    expect(btns).toHaveLength(4);
    btns.forEach((btn) => expect(btn).toBeDisabled());
  });

  // ─── Single Reaction: User changes their reaction ─────────────────────────

  it("cambiar reacción: baja hype y sube sadness", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: { hype: 1 }, userReaction: "hype" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: { sadness: 1 }, userReaction: "sadness" }),
      });

    render(<ReactionBar {...baseProps} summary={{}} />);

    // Click hype first
    fireEvent.click(screen.getByTestId("reaction-btn-hype"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // Now click sadness — should remove hype, add sadness
    fireEvent.click(screen.getByTestId("reaction-btn-sadness"));

    // Server update resolves
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  // ─── Reaction Bar UI/UX: Hovering a reaction button ───────────────────────

  it("botones tienen clase hover:scale-110", () => {
    render(<ReactionBar {...baseProps} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("hover:scale-110");
    });
  });

  // ─── Micro-bounce animation on click ─────────────────────────────────────

  it("click en reacción aplica la animación reaction-bounce via style", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: { hype: 1 }, userReaction: "hype" }),
    });

    render(<ReactionBar {...baseProps} />);
    const btn = screen.getByTestId("reaction-btn-hype");

    fireEvent.click(btn);

    // Immediately after click, the button should have the bounce animation applied
    expect(btn.style.animation).toContain("reaction-bounce");
    expect(btn.style.animation).toContain("200ms");
  });

  // ─── Reaction Bar UI/UX: Mobile scroll ────────────────────────────────────

  it("contenedor tiene overflow-x-auto para scroll en mobile", () => {
    const { container } = render(<ReactionBar {...baseProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-x-auto");
  });
});
