"use client";

import { useState } from "react";

type ReactionType = "hype" | "sadness" | "plot_twist" | "skip";

type ReactionSummary = Partial<Record<ReactionType, number>>;

interface ReactionBarProps {
  targetId: string;
  apiPath?: string;
  targetKey?: string;
  summary: ReactionSummary;
  userReaction: ReactionType | null;
  disabled?: boolean;
}

const REACTIONS: {
  type: ReactionType;
  emoji: string;
  tooltip: string;
  activeClass: string;
}[] = [
  {
    type: "hype",
    emoji: "🔥",
    tooltip: "¡Esto es épico!",
    activeClass: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  },
  {
    type: "sadness",
    emoji: "😭",
    tooltip: "Me destruyó emocionalmente",
    activeClass: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  },
  {
    type: "plot_twist",
    emoji: "😱",
    tooltip: "No vi venir ese giro",
    activeClass: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  },
  {
    type: "skip",
    emoji: "💤",
    tooltip: "El ritmo no me atrapó",
    activeClass: "text-[#849396] border-[#849396]/40 bg-[#849396]/10",
  },
];

export function ReactionBar({ targetId, apiPath = "/api/reactions", targetKey = "ratingId", summary, userReaction, disabled = false }: ReactionBarProps) {
  const [optimisticSummary, setOptimisticSummary] = useState<ReactionSummary>(summary);
  const [optimisticUserReaction, setOptimisticUserReaction] = useState<ReactionType | null>(userReaction);
  const [pending, setPending] = useState(false);
  const [bouncingType, setBouncingType] = useState<ReactionType | null>(null);

  async function handleReact(type: ReactionType) {
    if (disabled || pending) return;

    setBouncingType(type);
    setTimeout(() => setBouncingType(null), 200);

    const prevSummary = optimisticSummary;
    const prevUserReaction = optimisticUserReaction;

    const newSummary: ReactionSummary = { ...optimisticSummary };

    if (optimisticUserReaction) {
      const prev = newSummary[optimisticUserReaction] ?? 1;
      if (prev <= 1) {
        delete newSummary[optimisticUserReaction];
      } else {
        newSummary[optimisticUserReaction] = prev - 1;
      }
    }

    if (optimisticUserReaction === type) {
      setOptimisticUserReaction(null);
    } else {
      newSummary[type] = (newSummary[type] ?? 0) + 1;
      setOptimisticUserReaction(type);
    }

    setOptimisticSummary(newSummary);
    setPending(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [targetKey]: targetId, type }),
      });

      if (!res.ok) {
        setOptimisticSummary(prevSummary);
        setOptimisticUserReaction(prevUserReaction);
        return;
      }

      const data = await res.json();
      setOptimisticSummary(data.summary ?? {});
      setOptimisticUserReaction(data.userReaction ?? null);
    } catch {
      setOptimisticSummary(prevSummary);
      setOptimisticUserReaction(prevUserReaction);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto overflow-y-visible py-1 md:overflow-x-visible scroll-snap-x snap-x snap-mandatory">
      {REACTIONS.map(({ type, emoji, tooltip, activeClass }) => {
        const count = optimisticSummary[type] ?? 0;
        const isActive = optimisticUserReaction === type;
        const isBouncing = bouncingType === type;

        return (
          <button
            key={type}
            data-testid={`reaction-btn-${type}`}
            onClick={() => handleReact(type)}
            disabled={disabled || pending}
            aria-label={disabled ? "Iniciá sesión para reaccionar" : tooltip}
            style={
              isBouncing
                ? { animation: "reaction-bounce 200ms ease-out" }
                : undefined
            }
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium
              transition-all duration-150
              hover:scale-110
              ${isActive
                ? activeClass
                : "text-[#849396] border-white/5 hover:border-white/10 hover:text-[#dfe2eb]"
              }
              ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
              ${pending ? "opacity-70" : ""}
            `}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {count > 0 && (
              <span className="font-black tabular-nums">{count}</span>
            )}
          </button>
        );
      })}

      <style jsx>{`
        @keyframes reaction-bounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.95); }
          70%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
