"use client";

import { useState } from "react";
import { ThumbsUp, Heart, Zap, Flame } from "lucide-react";

type ReactionType = "like" | "love" | "surprise" | "angry";

type ReactionSummary = Partial<Record<ReactionType, number>>;

interface ReactionBarProps {
  ratingId: string;
  summary: ReactionSummary;
  userReaction: ReactionType | null;
  disabled?: boolean;
}

const REACTIONS: {
  type: ReactionType;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  activeClass: string;
}[] = [
  { type: "like", Icon: ThumbsUp, label: "Me gusta", activeClass: "text-[#00e5ff] border-[#00e5ff]/40" },
  { type: "love", Icon: Heart, label: "Me encanta", activeClass: "text-rose-400 border-rose-400/40" },
  { type: "surprise", Icon: Zap, label: "Sorpresa", activeClass: "text-yellow-400 border-yellow-400/40" },
  { type: "angry", Icon: Flame, label: "Enojado", activeClass: "text-orange-500 border-orange-500/40" },
];

export function ReactionBar({ ratingId, summary, userReaction, disabled = false }: ReactionBarProps) {
  const [optimisticSummary, setOptimisticSummary] = useState<ReactionSummary>(summary);
  const [optimisticUserReaction, setOptimisticUserReaction] = useState<ReactionType | null>(userReaction);
  const [pending, setPending] = useState(false);

  async function handleReact(type: ReactionType) {
    if (disabled || pending) return;

    // Snapshot for rollback
    const prevSummary = optimisticSummary;
    const prevUserReaction = optimisticUserReaction;

    // Optimistic update
    const newSummary: ReactionSummary = { ...optimisticSummary };

    if (optimisticUserReaction) {
      // Remove count for previous reaction
      const prev = newSummary[optimisticUserReaction] ?? 1;
      if (prev <= 1) {
        delete newSummary[optimisticUserReaction];
      } else {
        newSummary[optimisticUserReaction] = prev - 1;
      }
    }

    if (optimisticUserReaction === type) {
      // Toggling off — no new reaction to add
      setOptimisticUserReaction(null);
    } else {
      // Add new reaction count
      newSummary[type] = (newSummary[type] ?? 0) + 1;
      setOptimisticUserReaction(type);
    }

    setOptimisticSummary(newSummary);
    setPending(true);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId, type }),
      });

      if (!res.ok) {
        // Rollback on HTTP error
        setOptimisticSummary(prevSummary);
        setOptimisticUserReaction(prevUserReaction);
        return;
      }

      const data = await res.json();
      // Reconcile with server truth
      setOptimisticSummary(data.summary ?? {});
      setOptimisticUserReaction(data.userReaction ?? null);
    } catch {
      // Rollback on network error
      setOptimisticSummary(prevSummary);
      setOptimisticUserReaction(prevUserReaction);
    } finally {
      setPending(false);
    }
  }

  const totalReactions = Object.values(optimisticSummary).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTIONS.map(({ type, Icon, label, activeClass }) => {
        const count = optimisticSummary[type] ?? 0;
        const isActive = optimisticUserReaction === type;

        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            disabled={disabled || pending}
            title={disabled ? "Iniciá sesión para reaccionar" : label}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium
              transition-all duration-150
              ${isActive
                ? `bg-white/5 ${activeClass}`
                : "text-[#849396] border-white/5 hover:border-white/10 hover:text-[#dfe2eb]"
              }
              ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
              ${pending ? "opacity-70" : ""}
            `}
          >
            <Icon size={12} className={isActive ? "" : "opacity-70"} />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
      {totalReactions > 0 && (
        <span className="text-[0.6rem] text-[#849396] ml-1">
          {totalReactions} {totalReactions === 1 ? "reacción" : "reacciones"}
        </span>
      )}
    </div>
  );
}
