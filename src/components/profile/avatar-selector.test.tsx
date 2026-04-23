import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AvatarSelector, extractSeedFromUrl } from "@/components/profile/avatar-selector";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Stable UUID mock so seed generation is deterministic
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => {
    const n = uuidCounter++;
    // Produce a UUID where the first segment encodes n, giving unique seeds
    const a = n.toString(16).padStart(8, "0");
    const b = ((n >> 8) & 0xffff).toString(16).padStart(4, "0");
    return `${a}-${b}-4000-8000-000000000000`;
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderSelector(
  currentAvatarUrl: string | null = null,
  onAvatarChange = vi.fn()
) {
  return { onAvatarChange, ...render(<AvatarSelector currentAvatarUrl={currentAvatarUrl} onAvatarChange={onAvatarChange} />) };
}

// ─── extractSeedFromUrl ───────────────────────────────────────────────────────

describe("extractSeedFromUrl", () => {
  it("returns the seed param from a DiceBear URL", () => {
    const url = "https://api.dicebear.com/9.x/fun-emoji/svg?seed=myseed";
    expect(extractSeedFromUrl(url)).toBe("myseed");
  });

  it("returns a random seed when URL is null", () => {
    const seed = extractSeedFromUrl(null);
    expect(seed).toBeTruthy();
    expect(typeof seed).toBe("string");
  });

  it("returns a random seed when URL is not a DiceBear URL", () => {
    const seed = extractSeedFromUrl("https://example.com/avatar.png");
    expect(seed).toBeTruthy();
    expect(typeof seed).toBe("string");
  });
});

// ─── AvatarSelector ───────────────────────────────────────────────────────────

describe("AvatarSelector", () => {
  beforeEach(() => {
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("renders the preview image with a DiceBear src", () => {
    renderSelector();
    const preview = screen.getByAltText("Avatar seleccionado") as HTMLImageElement;
    expect(preview.src).toContain("api.dicebear.com");
  });

  it("renders the avatar grid after mount", async () => {
    await act(async () => {
      renderSelector();
    });
    const options = screen.getAllByAltText("Opción avatar");
    expect(options.length).toBe(12);
  });

  it("clicking an avatar option calls onAvatarChange with a DiceBear URL", async () => {
    const onAvatarChange = vi.fn();
    await act(async () => {
      render(<AvatarSelector currentAvatarUrl={null} onAvatarChange={onAvatarChange} />);
    });

    // Avatar grid buttons have accessible name "Opción avatar" (from img alt)
    const avatarButtons = screen.getAllByRole("button", { name: "Opción avatar" });

    await act(async () => {
      fireEvent.click(avatarButtons[0]);
    });

    expect(onAvatarChange).toHaveBeenCalledWith(expect.stringContaining("api.dicebear.com"));
  });

  it("clicking 'Nuevas opciones' regenerates the grid", async () => {
    // Use a counter that produces different hex strings
    uuidCounter = 0;
    await act(async () => {
      renderSelector();
    });

    const imagesBefore = screen.getAllByAltText("Opción avatar").map((img) => (img as HTMLImageElement).src);

    // Advance counter significantly so generated seeds are different
    uuidCounter = 9999;

    await act(async () => {
      fireEvent.click(screen.getByTitle("Generar nuevas opciones"));
    });

    const imagesAfter = screen.getAllByAltText("Opción avatar").map((img) => (img as HTMLImageElement).src);
    // At least one image should differ (seeds changed)
    const changed = imagesAfter.some((src, i) => src !== imagesBefore[i]);
    expect(changed).toBe(true);
  });

  it("does not call onAvatarChange on initial render", async () => {
    const onAvatarChange = vi.fn();
    await act(async () => {
      render(<AvatarSelector currentAvatarUrl={null} onAvatarChange={onAvatarChange} />);
    });
    // Only called if selection actually changed, not on mount
    expect(onAvatarChange).not.toHaveBeenCalled();
  });

  it("uses the seed from a DiceBear currentAvatarUrl for the preview", async () => {
    const url = "https://api.dicebear.com/9.x/fun-emoji/svg?seed=fixedseed";
    await act(async () => {
      renderSelector(url);
    });
    const preview = screen.getByAltText("Avatar seleccionado") as HTMLImageElement;
    expect(preview.src).toContain("seed=fixedseed");
  });
});
