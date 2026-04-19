import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserLink } from "@/components/shared/user-link";

// Mock next/link — renders a plain <a> with href
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock Avatar components — render simple divs
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src }: { src?: string }) => (
    <img data-testid="avatar-image" src={src} alt="" />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="avatar-fallback">{children}</span>
  ),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("UserLink", () => {
  const baseProps = {
    userId: "user-123",
    userName: "Alice",
    userAvatar: "https://example.com/alice.jpg",
    userHandle: null,
  };

  it("renders the user's name", () => {
    render(<UserLink {...baseProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders an avatar", () => {
    render(<UserLink {...baseProps} />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("renders the avatar image src when userAvatar is provided", () => {
    render(<UserLink {...baseProps} />);
    const img = screen.getByTestId("avatar-image") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/alice.jpg");
  });

  it("renders plain text (no link) when userHandle is null", () => {
    render(<UserLink {...baseProps} userHandle={null} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders a link when userHandle is provided", () => {
    render(<UserLink {...baseProps} userHandle="alice99" />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("link has correct href based on userHandle", () => {
    render(<UserLink {...baseProps} userHandle="alice99" />);
    const link = screen.getByRole("link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/profile/alice99");
  });

  it("renders avatar fallback initial when no avatar src", () => {
    render(<UserLink {...baseProps} userAvatar={null} />);
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("A");
  });
});
