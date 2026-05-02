import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommentCard } from "@/components/title/comment-card";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href, className }: Record<string, unknown>) => (
    <a href={href as string} className={className as string} data-testid="next-link">
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/lib/i18n", () => ({
  t: {
    title: {
      timeAgoMinutes: (n: number) => `Hace ${n} min`,
      timeAgoHours: (n: number) => `Hace ${n} h`,
      yesterday: "Ayer",
      timeAgoDays: (n: number) => `Hace ${n} d`,
      timeAgoMonths: (n: number) => `Hace ${n} m`,
      anonymous: "Anónimo",
    },
    comments: {
      reply: "Responder",
      replyPlaceholder: "Respuesta...",
      delete: "Borrar",
      deleteConfirm: "¿Seguro?",
      deleted: "eliminado",
      deleteHasReplies: (n: number) =>
        `Este comentario tiene ${n} respuestas. No se puede eliminar.`,
      deleteNoUndo: "Esta acción no se puede deshacer.",
    },
  },
}));

vi.mock("lucide-react", () => ({
  Trash2: ({ size, className }: Record<string, unknown>) => (
    <span data-testid="icon-trash" className={className as string} />
  ),
  MessageCircle: ({ size, className }: Record<string, unknown>) => (
    <span data-testid="icon-reply" className={className as string} />
  ),
}));

const mockReactionBar = vi.fn();
vi.mock("@/components/shared/reaction-bar", () => ({
  ReactionBar: (props: Record<string, unknown>) => {
    mockReactionBar(props);
    return <div data-testid="reaction-bar" />;
  },
}));

vi.mock("@/components/shared/user-link", () => ({
  UserLink: ({
    userName,
    userHandle,
  }: {
    userName: string;
    userHandle: string | null;
  }) => (
    <span data-testid="user-link">
      {userName}
      {userHandle ? `@${userHandle}` : ""}
    </span>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseProps = {
  id: "comment-1",
  userName: "Alice",
  userImage: null,
  userHandle: "alice",
  body: "Qué buena reseña",
  createdAt: new Date("2026-05-01T12:00:00Z"),
  isOwner: false,
  isGuest: false,
  replyCount: 0,
  onReply: vi.fn().mockResolvedValue(undefined),
  onOpenDeleteDialog: vi.fn(),
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CommentCard — ReactionBar integration", () => {
  it("renders ReactionBar with correct comment-reaction props", () => {
    render(<CommentCard {...baseProps} />);

    expect(screen.getByTestId("reaction-bar")).toBeInTheDocument();
    expect(mockReactionBar).toHaveBeenCalledTimes(1);

    const reactionProps = mockReactionBar.mock.calls[0][0];
    expect(reactionProps.targetId).toBe("comment-1");
    expect(reactionProps.apiPath).toBe("/api/comment-reactions");
    expect(reactionProps.targetKey).toBe("commentId");
  });

  it("passes disabled={true} to ReactionBar when isGuest is true", () => {
    render(<CommentCard {...baseProps} isGuest={true} />);

    const reactionProps = mockReactionBar.mock.calls[0][0];
    expect(reactionProps.disabled).toBe(true);
  });

  it("does NOT pass disabled (or passes false) when isGuest is false", () => {
    render(<CommentCard {...baseProps} isGuest={false} />);

    const reactionProps = mockReactionBar.mock.calls[0][0];
    expect(reactionProps.disabled).toBe(false);
  });

  it("passes reactionSummary and userReaction through to ReactionBar", () => {
    render(
      <CommentCard
        {...baseProps}
        reactionSummary={{ hype: 3, sadness: 1 }}
        userReaction="hype"
      />
    );

    const reactionProps = mockReactionBar.mock.calls[0][0];
    expect(reactionProps.summary).toEqual({ hype: 3, sadness: 1 });
    expect(reactionProps.userReaction).toBe("hype");
  });

  it("passes empty summary and null userReaction by default", () => {
    render(<CommentCard {...baseProps} />);

    const reactionProps = mockReactionBar.mock.calls[0][0];
    expect(reactionProps.summary).toEqual({});
    expect(reactionProps.userReaction).toBeNull();
  });
});
