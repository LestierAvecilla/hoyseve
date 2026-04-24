import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "./sidebar-provider";

// ─── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ─── Test consumer ───────────────────────────────────────────────────────────

function Consumer() {
  const { isCollapsed, sidebarWidth, toggle, setCollapsed } = useSidebar();
  return (
    <div>
      <span data-testid="collapsed">{String(isCollapsed)}</span>
      <span data-testid="width">{sidebarWidth}</span>
      <button onClick={toggle} data-testid="toggle">toggle</button>
      <button onClick={() => setCollapsed(true)} data-testid="collapse">collapse</button>
      <button onClick={() => setCollapsed(false)} data-testid="expand">expand</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <SidebarProvider>
      <Consumer />
    </SidebarProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SidebarProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.style.removeProperty("--sidebar-width");
  });

  it("starts expanded by default", () => {
    renderProvider();
    expect(screen.getByTestId("collapsed").textContent).toBe("false");
    expect(screen.getByTestId("width").textContent).toBe("160");
  });

  it("toggle switches collapsed state", () => {
    renderProvider();
    act(() => {
      screen.getByTestId("toggle").click();
    });
    expect(screen.getByTestId("collapsed").textContent).toBe("true");
    expect(screen.getByTestId("width").textContent).toBe("80");
  });

  it("setCollapsed(true) collapses", () => {
    renderProvider();
    act(() => {
      screen.getByTestId("collapse").click();
    });
    expect(screen.getByTestId("collapsed").textContent).toBe("true");
  });

  it("setCollapsed(false) expands", () => {
    renderProvider();
    act(() => {
      screen.getByTestId("collapse").click();
    });
    act(() => {
      screen.getByTestId("expand").click();
    });
    expect(screen.getByTestId("collapsed").textContent).toBe("false");
    expect(screen.getByTestId("width").textContent).toBe("160");
  });

  it("persists state to localStorage on toggle", () => {
    renderProvider();
    act(() => {
      screen.getByTestId("toggle").click();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith("sidebar-collapsed", "true");
  });

  it("sets CSS variable --sidebar-width on mount", () => {
    renderProvider();
    const val = document.documentElement.style.getPropertyValue("--sidebar-width");
    expect(val).toBe("160px");
  });

  it("updates CSS variable --sidebar-width when collapsed", () => {
    renderProvider();
    act(() => {
      screen.getByTestId("collapse").click();
    });
    const val = document.documentElement.style.getPropertyValue("--sidebar-width");
    expect(val).toBe("80px");
  });

  it("throws if useSidebar is used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      "useSidebar must be used within SidebarProvider"
    );
    consoleError.mockRestore();
  });
});
