import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamingPlatforms } from "@/components/title/streaming-platforms";
import type { StreamingProvider } from "@/lib/tmdb";

// ─── Mock next/image ───────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    title,
    className,
  }: {
    src: string;
    alt: string;
    title?: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      title={title}
      className={className}
      data-testid="streaming-logo"
    />
  ),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

function provider(overrides: Partial<StreamingProvider> = {}): StreamingProvider {
  return {
    providerId: 1,
    providerName: "Netflix",
    logoPath: "https://image.tmdb.org/t/p/w45/netflix.jpg",
    displayPriority: 1,
    ...overrides,
  };
}

function providers(count: number): StreamingProvider[] {
  return Array.from({ length: count }, (_, i) =>
    provider({
      providerId: i + 1,
      providerName: `Provider ${i + 1}`,
      logoPath: `https://image.tmdb.org/t/p/w45/provider-${i + 1}.jpg`,
      displayPriority: i + 1,
    })
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("StreamingPlatforms", () => {
  // ── Empty / null states ───────────────────────────────────────────────────

  it("returns null when providers array is empty", () => {
    const { container } = render(<StreamingPlatforms providers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Rendering counts ──────────────────────────────────────────────────────

  it("renders exactly 3 logos for 3 providers", () => {
    render(<StreamingPlatforms providers={providers(3)} />);
    const logos = screen.getAllByTestId("streaming-logo");
    expect(logos).toHaveLength(3);
  });

  it("renders all 6 logos for exactly 6 providers with no '+N' badge", () => {
    render(<StreamingPlatforms providers={providers(6)} />);
    const logos = screen.getAllByTestId("streaming-logo");
    expect(logos).toHaveLength(6);
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it("renders first 6 logos and a '+N' badge when there are 7+ providers", () => {
    render(<StreamingPlatforms providers={providers(9)} />);
    const logos = screen.getAllByTestId("streaming-logo");
    expect(logos).toHaveLength(6);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("shows correct overflow count for 10 providers", () => {
    render(<StreamingPlatforms providers={providers(10)} />);
    expect(screen.getByText("+4")).toBeInTheDocument();
  });

  // ── Attributes (alt, title) ───────────────────────────────────────────────

  it("sets correct alt text on provider images", () => {
    render(
      <StreamingPlatforms
        providers={[
          provider({ providerName: "Netflix" }),
          provider({ providerId: 2, providerName: "HBO Max" }),
        ]}
      />
    );
    const logos = screen.getAllByTestId("streaming-logo");
    expect(logos[0]).toHaveAttribute("alt", "Netflix");
    expect(logos[1]).toHaveAttribute("alt", "HBO Max");
  });

  it("sets correct title attribute on provider images", () => {
    render(
      <StreamingPlatforms
        providers={[
          provider({ providerName: "Disney+" }),
        ]}
      />
    );
    // Tooltip text is now a visible span on hover, not a title attribute on the image
    expect(screen.getByText("Disney+")).toBeInTheDocument();
  });

  // ── Label prop ────────────────────────────────────────────────────────────

  it("renders the label when provided", () => {
    render(
      <StreamingPlatforms
        providers={providers(1)}
        label="Disponible en"
      />
    );
    expect(screen.getByText("Disponible en")).toBeInTheDocument();
  });

  it("does not render a label element when label is not provided", () => {
    render(<StreamingPlatforms providers={providers(1)} />);
    // The only rendered elements should be the provider images, no extra span
    const logos = screen.getAllByTestId("streaming-logo");
    expect(logos).toHaveLength(1);
    // The label text should not appear anywhere in the component
    expect(screen.queryByText("Disponible en")).toBeNull();
  });
});
