"use client";

import { Heart, MessageCircle, AtSign, Star } from "lucide-react";
import type { NotificationGroup, GroupedActor } from "@/lib/notifications/group";
import { formatActorNames } from "@/lib/notifications/group";
import { t } from "@/lib/i18n";

// ─── Time-ago helper ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes}min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `hace ${diffDays}d`;
  return `hace ${diffMonths}mes`;
}

// ─── Notification type config ─────────────────────────────────────────────────

const typeConfig: Record<string, { icon: typeof Heart; color: string }> = {
  REACTION_ON_REVIEW: { icon: Heart, color: "text-rose-400" },
  REACTION_ON_COMMENT: { icon: Heart, color: "text-rose-400" },
  REPLY_ON_COMMENT: { icon: MessageCircle, color: "text-cyan-400" },
  MENTION: { icon: AtSign, color: "text-amber-400" },
};

function getNotificationMessage(
  type: string,
  actorNamesStr: string,
  isSingular: boolean
): string {
  const i18n = t as unknown as Record<string, unknown>;
  const ns = (i18n.notifications as Record<string, unknown>) ?? {};

  if (isSingular) {
    const singular = (ns.singular as Record<string, string> | undefined) ?? {};
    switch (type) {
      case "REACTION_ON_REVIEW":
        return (singular.reactionOnReview as string)
          .replace("{actor}", actorNamesStr);
      case "REACTION_ON_COMMENT":
        return (singular.reactionOnComment as string)
          .replace("{actor}", actorNamesStr);
      case "REPLY_ON_COMMENT":
        return (singular.replyOnComment as string)
          .replace("{actor}", actorNamesStr);
      case "MENTION":
        return (singular.mention as string)
          .replace("{actor}", actorNamesStr);
      default:
        return actorNamesStr;
    }
  }

  switch (type) {
    case "REACTION_ON_REVIEW":
      return ((ns.reactionOnReview as string) ?? "{actors} reaccionaron a tu reseña")
        .replace("{actors}", actorNamesStr);
    case "REACTION_ON_COMMENT":
      return ((ns.reactionOnComment as string) ?? "{actors} reaccionaron a tu comentario")
        .replace("{actors}", actorNamesStr);
    case "REPLY_ON_COMMENT":
      return ((ns.replyOnComment as string) ?? "{actors} respondieron tu comentario")
        .replace("{actors}", actorNamesStr);
    case "MENTION":
      return ((ns.mention as string) ?? "{actors} te mencionaron en un comentario")
        .replace("{actors}", actorNamesStr);
    default:
      return actorNamesStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  group: NotificationGroup;
  onClick: (group: NotificationGroup) => void;
}

export function NotificationItem({ group, onClick }: NotificationItemProps) {
  const config = typeConfig[group.type] ?? {
    icon: Star,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const isSingular = group.totalActorCount === 1;
  const actorNamesStr = formatActorNames(group.actors, group.totalActorCount);
  const message = getNotificationMessage(group.type, actorNamesStr, isSingular);

  const isDeleted = group.targetPreview === null;

  return (
    <button
      onClick={() => onClick(group)}
      className={`
        w-full flex items-start gap-3 px-3 py-2.5 text-left
        hover:bg-accent/50 transition-colors rounded-lg
        ${group.read ? "opacity-60" : ""}
      `}
    >
      {/* Type icon */}
      <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{message}</p>
        {group.targetPreview ? (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {group.targetPreview}
          </p>
        ) : isDeleted ? (
          <p className="text-xs text-muted-foreground italic mt-0.5">
            {(t as unknown as Record<string, Record<string, string>>).notifications?.deletedContent ?? "[contenido eliminado]"}
          </p>
        ) : null}
      </div>

      {/* Time */}
      <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
        {timeAgo(group.latestCreatedAt)}
      </span>

      {/* Unread dot */}
      {!group.read && (
        <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}
