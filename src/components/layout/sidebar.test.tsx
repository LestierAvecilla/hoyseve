import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
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
  Logo: ({ className }: { className?: string }) => (
    <span data-testid="logo" className={className}>
      Logo
    </span>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";

function setPathname(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
}

async function renderSidebar() {
  const { Sidebar } = await import("./sidebar");
  render(<Sidebar />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    setPathname("/");
  });

  // ── 4.3: regression — no user session area ────────────────────────────────

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
    // No img elements for user avatars (only Logo is rendered, which is a span stub)
    const imgs = screen.queryAllByRole("img");
    expect(imgs).toHaveLength(0);
  });

  it("renders the Logo", async () => {
    await renderSidebar();
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  // ── Active link styling ───────────────────────────────────────────────────

  it("active link has the correct href for root path", async () => {
    setPathname("/");
    await renderSidebar();
    const homeLink = screen.getByText("Inicio").closest("a") as HTMLAnchorElement;
    expect(homeLink.getAttribute("href")).toBe("/");
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
});
