import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React, { useState } from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// next-auth/react
const mockSignOut = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// next/image — plain <img>
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
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

// @/lib/i18n — static strings
vi.mock("@/lib/i18n", () => ({
  t: {
    search: { placeholder: "Buscar...", noResults: "Sin resultados", movie: "Película", tv: "Serie" },
    anime: { title: "Anime" },
    login: { tabLogin: "Entrar", tabRegister: "Registro" },
    nav: { home: "Inicio", feed: "Feed", watchlist: "Lista", profile: "Perfil" },
  },
}));

// @/components/ui/dropdown-menu — stateful stub: items only visible after trigger click
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
      <div data-testid="dropdown-menu" data-open={open}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          // Pass open state down to children via cloneElement
          return React.cloneElement(child as React.ReactElement<{ open?: boolean; onToggle?: () => void }>, {
            open,
            onToggle: () => setOpen((v) => !v),
          });
        })}
      </div>
    );
  },
  DropdownMenuTrigger: ({
    children,
    className,
    onToggle,
  }: {
    children: React.ReactNode;
    className?: string;
    open?: boolean;
    onToggle?: () => void;
  }) => (
    <button data-testid="dropdown-trigger" className={className} onClick={onToggle}>
      {children}
    </button>
  ),
  DropdownMenuPositioner: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) =>
    open ? (
      <div data-testid="dropdown-positioner">{children}</div>
    ) : null,
  DropdownMenuPopup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-popup">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button data-testid="dropdown-item" onClick={onClick} className={className}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { useSession } from "next-auth/react";

function setSession(session: Record<string, unknown> | null) {
  if (session) {
    vi.mocked(useSession).mockReturnValue({
      data: session as unknown as ReturnType<typeof useSession>["data"] & NonNullable<unknown>,
      status: "authenticated",
      update: vi.fn(),
    } as ReturnType<typeof useSession>);
  } else {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    } as ReturnType<typeof useSession>);
  }
}

async function renderNavbar() {
  const { Navbar } = await import("./navbar");
  render(<Navbar />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // ── 4.1: authenticated session + dropdown visibility ──────────────────────

  describe("authenticated session", () => {
    it("renders the dropdown trigger with the user name", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();
      expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("opens the dropdown and shows 'Ver perfil' menu item after trigger click", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      // Items should NOT be visible before clicking
      expect(screen.queryByTestId("dropdown-positioner")).not.toBeInTheDocument();

      // Click the trigger
      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      // Now items should be visible
      const items = screen.getAllByTestId("dropdown-item");
      const profileItem = items.find((el) => el.textContent?.includes("Ver perfil"));
      expect(profileItem).toBeInTheDocument();
    });

    it("opens the dropdown and shows 'Cerrar sesión' menu item after trigger click", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      const items = screen.getAllByTestId("dropdown-item");
      const logoutItem = items.find((el) => el.textContent?.includes("Cerrar sesión"));
      expect(logoutItem).toBeInTheDocument();
    });

    it("opens the dropdown and shows separator between profile and logout items", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      expect(screen.getByTestId("dropdown-separator")).toBeInTheDocument();
    });

    it("shows user avatar image when session.user.image is set", async () => {
      setSession({
        user: {
          name: "Alice",
          email: "alice@example.com",
          image: "https://example.com/avatar.jpg",
        },
      });
      await renderNavbar();
      const img = screen.getByRole("img", { name: "Alice" }) as HTMLImageElement;
      expect(img.src).toBe("https://example.com/avatar.jpg");
    });

    it("does NOT render login/register links when authenticated", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();
      expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
      expect(screen.queryByText("Registro")).not.toBeInTheDocument();
    });
  });

  // ── Unauthenticated state ─────────────────────────────────────────────────

  describe("unauthenticated session", () => {
    it("renders login and register links when no session", async () => {
      setSession(null);
      await renderNavbar();
      expect(screen.getByText("Entrar")).toBeInTheDocument();
      expect(screen.getByText("Registro")).toBeInTheDocument();
    });

    it("does NOT render the dropdown when unauthenticated", async () => {
      setSession(null);
      await renderNavbar();
      expect(screen.queryByTestId("dropdown-trigger")).not.toBeInTheDocument();
    });
  });

  // ── 4.2: interaction tests (router.push + signOut) ────────────────────────

  describe("dropdown interactions", () => {
    it("navigates to /profile when 'Ver perfil' is clicked", async () => {
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      const items = screen.getAllByTestId("dropdown-item");
      const profileItem = items.find((el) => el.textContent?.includes("Ver perfil"))!;
      fireEvent.click(profileItem);

      expect(mockPush).toHaveBeenCalledWith("/profile");
    });

    it("calls signOut({ redirect: false }) when 'Cerrar sesión' is clicked", async () => {
      mockSignOut.mockResolvedValueOnce(undefined);
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      const items = screen.getAllByTestId("dropdown-item");
      const logoutItem = items.find((el) => el.textContent?.includes("Cerrar sesión"))!;
      fireEvent.click(logoutItem);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
      });
    });

    it("redirects to / and refreshes after logout", async () => {
      mockSignOut.mockResolvedValueOnce(undefined);
      setSession({ user: { name: "Alice", email: "alice@example.com", image: null } });
      await renderNavbar();

      fireEvent.click(screen.getByTestId("dropdown-trigger"));

      const items = screen.getAllByTestId("dropdown-item");
      const logoutItem = items.find((el) => el.textContent?.includes("Cerrar sesión"))!;
      fireEvent.click(logoutItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });
});
