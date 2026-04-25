import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// next/link — plain <a>
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
    title,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    title?: string;
  }) => (
    <a href={href} className={className} onClick={onClick} title={title}>
      {children}
    </a>
  ),
}));

// @/lib/i18n — static nav strings
vi.mock("@/lib/i18n", () => ({
  t: {
    nav: { home: "Inicio", feed: "Feed", watchlist: "Lista", profile: "Perfil" },
  },
}));

// @/components/shared/logo — stub
vi.mock("@/components/shared/logo", () => ({
  Logo: ({ className, animate, collapsed }: { className?: string; animate?: boolean; collapsed?: boolean }) => (
    <span
      data-testid="logo"
      data-animate={animate ? "true" : undefined}
      data-collapsed={collapsed ? "true" : undefined}
      className={className}
    >
      {collapsed ? "👁" : "Logo"}
    </span>
  ),
}));

// @/components/ui/tooltip — stub
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipRoot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, render }: { children?: React.ReactNode; render?: React.ReactElement; asChild?: boolean }) => (
    <>{render ?? children}</>
  ),
  TooltipPositioner: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="tooltip-positioner">{children}</div>
  ),
  TooltipPopup: ({ children }: { children: React.ReactNode }) => (
    <span data-slot="tooltip-popup">{children}</span>
  ),
}));

// localStorage mock
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";

function setPathname(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
}

async function renderSidebar(collapsed = false) {
  const { SidebarProvider } = await import("./sidebar-provider");
  const { Sidebar } = await import("./sidebar");

  // Pre-seed localStorage if needed
  if (collapsed) {
    localStorageMock.getItem.mockReturnValueOnce("true");
  }

  render(
    <SidebarProvider>
      <Sidebar />
    </SidebarProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.resetModules();
    setPathname("/");
    localStorageMock.clear();
    // Ensure getItem returns null by default (expanded)
    localStorageMock.getItem.mockReturnValue(null as unknown as string);
    // Reset CSS var on document
    document.documentElement.style.removeProperty("--sidebar-width");
  });

  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders all four nav items", async () => {
    await renderSidebar();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
  });

  it("includes a /profile link in the nav", async () => {
    await renderSidebar();
    const links = screen.getAllByRole("link") as HTMLAnchorElement[];
    const profileLink = links.find((l) => l.getAttribute("href") === "/profile");
    expect(profileLink).toBeInTheDocument();
  });

  it("does NOT render any logout button", async () => {
    await renderSidebar();
    const allButtons = screen.queryAllByRole("button");
    const logoutBtn = allButtons.find(
      (b) => b.textContent?.match(/cerrar sesión|logout|salir/i)
    );
    expect(logoutBtn).toBeUndefined();
  });

  it("does NOT render login or register links", async () => {
    await renderSidebar();
    const links = screen.getAllByRole("link") as HTMLAnchorElement[];
    const loginLink = links.find((l) => l.getAttribute("href") === "/login");
    expect(loginLink).toBeUndefined();
  });

  it("does NOT render any user session info (name/avatar/email)", async () => {
    await renderSidebar();
    const imgs = screen.queryAllByRole("img");
    expect(imgs).toHaveLength(0);
  });

  it("renders the Logo", async () => {
    await renderSidebar();
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("all nav links have correct hrefs", async () => {
    await renderSidebar();
    const links = screen.getAllByRole("link") as HTMLAnchorElement[];
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/feed");
    expect(hrefs).toContain("/watchlist");
    expect(hrefs).toContain("/profile");
  });

  // ── Active link styling ───────────────────────────────────────────────────

  it("active link has the correct href for root path", async () => {
    setPathname("/");
    await renderSidebar();
    const homeLink = screen.getByText("Inicio").closest("a") as HTMLAnchorElement;
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  // ── Collapse/expand behavior ──────────────────────────────────────────────

  it("expands sidebar when aside is clicked while collapsed", async () => {
    const { SidebarProvider } = await import("./sidebar-provider");
    const { Sidebar } = await import("./sidebar");

    localStorageMock.getItem.mockReturnValue("true");

    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    );

    const aside = document.querySelector("aside")!;
    // Initially collapsed — logo uses compact
    const logoEl = screen.getByTestId("logo");
    expect(logoEl.getAttribute("data-collapsed")).toBe("true");

    fireEvent.click(aside);
    // After expand — logo uses animate, not compact
    const expandedLogo = screen.getByTestId("logo");
    expect(expandedLogo.getAttribute("data-collapsed")).not.toBe("true");
  });

  it("nav item clicks do not propagate to aside", async () => {
    const { SidebarProvider } = await import("./sidebar-provider");
    const { Sidebar } = await import("./sidebar");

    localStorageMock.getItem.mockReturnValue("true");
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    );

    const aside = document.querySelector("aside")!;
    const asideClickSpy = vi.fn();
    aside.addEventListener("click", asideClickSpy, true);

    // Click on nav link — stopPropagation should prevent aside handler
    const feedLink = screen.getAllByRole("link").find(
      (l) => (l as HTMLAnchorElement).getAttribute("href") === "/feed"
    )!;

    fireEvent.click(feedLink);
    // Sidebar should remain collapsed — logo still has scale class
    expect(screen.getByTestId("logo").getAttribute("data-collapsed")).toBe("true");

    aside.removeEventListener("click", asideClickSpy, true);
  });

  it("shows compact logo when collapsed", async () => {
    const { SidebarProvider } = await import("./sidebar-provider");
    const { Sidebar } = await import("./sidebar");

    localStorageMock.getItem.mockReturnValue("true");
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    );

    const logoEl = screen.getByTestId("logo");
    expect(logoEl.getAttribute("data-collapsed")).toBe("true");
  });

  it("shows full logo with animate when expanded", async () => {
    await renderSidebar(false);
    const logoEl = screen.getByTestId("logo");
    expect(logoEl.getAttribute("data-animate")).toBe("true");
    expect(logoEl.getAttribute("data-collapsed")).not.toBe("true");
  });

  it("collapses sidebar when clicking outside", async () => {
    const { SidebarProvider } = await import("./sidebar-provider");
    const { Sidebar } = await import("./sidebar");

    // Start expanded
    localStorageMock.getItem.mockReturnValue(null as unknown as string);
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    );

    // Verify expanded — no scale
    expect(screen.getByTestId("logo").getAttribute("data-collapsed")).not.toBe("true");

    // Click outside sidebar
    fireEvent.mouseDown(document.body);

    // Should now be collapsed — logo has scale
    expect(screen.getByTestId("logo").getAttribute("data-collapsed")).toBe("true");
  });

  it("uses tooltip components for nav items when collapsed", async () => {
    const { SidebarProvider } = await import("./sidebar-provider");
    const { Sidebar } = await import("./sidebar");

    localStorageMock.getItem.mockReturnValue("true");
    render(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    );

    // Tooltip popups should be rendered with nav labels
    const tooltipPopups = document.querySelectorAll('[data-slot="tooltip-popup"]');
    expect(tooltipPopups.length).toBeGreaterThan(0);
  });
});
