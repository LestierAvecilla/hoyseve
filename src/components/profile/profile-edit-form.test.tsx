import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// next-auth/react
const mockUpdateSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ update: mockUpdateSession }),
}));

// next/link
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// AvatarSelector — stub out so tests focus on the form logic
vi.mock("@/components/profile/avatar-selector", () => ({
  AvatarSelector: ({ onAvatarChange }: { onAvatarChange: (url: string) => void }) => (
    <div data-testid="avatar-selector">
      <button type="button" onClick={() => onAvatarChange("https://api.dicebear.com/9.x/fun-emoji/svg?seed=test")}>
        Cambiar avatar
      </button>
    </div>
  ),
}));

// sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_DATA = {
  name: "Alice Doe",
  username: "alicedoe",
  bio: "Hola soy Alice",
  image: null,
};

async function renderForm(initialData = INITIAL_DATA) {
  // Dynamic import so mocks are in place before the module resolves
  const { ProfileEditForm } = await import("./profile-edit-form");
  render(<ProfileEditForm initialData={initialData} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProfileEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders name, username, bio inputs with initial values", async () => {
    await renderForm();
    expect(screen.getByDisplayValue("Alice Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alicedoe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hola soy Alice")).toBeInTheDocument();
  });

  it("renders submit button", async () => {
    await renderForm();
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it("renders cancel link pointing to /profile", async () => {
    await renderForm();
    const link = screen.getByRole("link", { name: /cancelar/i }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/profile");
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it("shows required message when name is cleared", async () => {
    await renderForm();
    const nameInput = screen.getByDisplayValue("Alice Doe");
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "" } });
    });
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("submit button is disabled when name is empty", async () => {
    await renderForm();
    const nameInput = screen.getByDisplayValue("Alice Doe");
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "" } });
    });
    const btn = screen.getByRole("button", { name: /guardar cambios/i });
    expect(btn).toBeDisabled();
  });

  it("shows bio over-limit message when bio exceeds 160 chars", async () => {
    await renderForm();
    const bioArea = screen.getByDisplayValue("Hola soy Alice");
    await act(async () => {
      fireEvent.change(bioArea, { target: { value: "a".repeat(161) } });
    });
    expect(screen.getByText(/la bio no puede superar/i)).toBeInTheDocument();
  });

  it("shows toast.error and does NOT call fetch when client validation fails (empty name on submit)", async () => {
    await renderForm();
    const nameInput = screen.getByDisplayValue("Alice Doe");
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "" } });
    });
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(mockToastError).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Success flow ───────────────────────────────────────────────────────────

  it("calls updateSession, shows success toast, and navigates on 200 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { name: "Alice Doe", username: "alicedoe", image: null } }),
    });

    await renderForm();
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockUpdateSession).toHaveBeenCalledWith({
        name: "Alice Doe",
        username: "alicedoe",
        image: null,
      });
      expect(mockToastSuccess).toHaveBeenCalledWith("Perfil actualizado");
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  // ── Error flows ────────────────────────────────────────────────────────────

  it("shows TAKEN error toast on 409 TAKEN response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { code: "TAKEN", message: "Ese username ya está en uso" } }),
    });

    await renderForm();
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Ese username ya está en uso");
    });
  });

  it("shows TOO_RECENTLY_CHANGED error toast on that response code", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: "TOO_RECENTLY_CHANGED", message: "Debés esperar 30 días" },
      }),
    });

    await renderForm();
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Debés esperar 30 días");
    });
  });

  it("shows generic error toast for unknown error code", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { code: "SERVER_ERROR" } }),
    });

    await renderForm();
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Error al guardar. Intentá de nuevo.");
    });
  });

  it("shows network error toast when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    await renderForm();
    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Error de red. Intentá de nuevo.");
    });
  });

  // ── Avatar selector integration ────────────────────────────────────────────

  it("updates avatarUrl when AvatarSelector fires onAvatarChange", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { name: "Alice Doe", username: "alicedoe", image: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=test" } }),
    });

    await renderForm();

    await act(async () => {
      fireEvent.click(screen.getByText("Cambiar avatar"));
    });

    const form = screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/users/profile",
        expect.objectContaining({
          body: expect.stringContaining("dicebear.com"),
        })
      );
    });
  });
});
