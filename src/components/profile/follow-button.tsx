"use client";

import { useState, useCallback } from "react";
import { t } from "@/lib/i18n";

type FollowState = "idle" | "loading" | "following" | "not_following";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  isOwnProfile,
  onFollowChange,
}: FollowButtonProps) {
  const [state, setState] = useState<FollowState>(
    initialIsFollowing ? "following" : "not_following"
  );

  const handleFollow = useCallback(async () => {
    if (state === "loading" || isOwnProfile) return;

    setState("loading");

    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        setState("following");
        onFollowChange?.(true);
      } else if (res.status === 409) {
        // Already following, just update state
        setState("following");
        onFollowChange?.(true);
      } else {
        // Error - rollback
        setState(initialIsFollowing ? "following" : "not_following");
      }
    } catch {
      // Network error - rollback
      setState(initialIsFollowing ? "following" : "not_following");
    }
  }, [state, targetUserId, isOwnProfile, initialIsFollowing]);

  const handleUnfollow = useCallback(async () => {
    if (state === "loading" || isOwnProfile) return;

    setState("loading");

    try {
      const res = await fetch("/api/follows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok || res.status === 204) {
        setState("not_following");
        onFollowChange?.(false);
      } else if (res.status === 404) {
        // Not following anyway
        setState("not_following");
      } else {
        // Error - rollback
        setState(initialIsFollowing ? "following" : "not_following");
      }
    } catch {
      // Network error - rollback
      setState(initialIsFollowing ? "following" : "not_following");
    }
  }, [state, targetUserId, isOwnProfile, initialIsFollowing]);

  // Own profile - show placeholder button
  if (isOwnProfile) {
    return (
      <button
        disabled
        className="px-6 py-2.5 bg-gradient-to-br from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-bold rounded-xl text-sm cursor-default opacity-70"
      >
        {t.profile.editProfile}
      </button>
    );
  }

  const isLoading = state === "loading";
  const isNotFollowing = state === "not_following";

  // Not following state
  if (isNotFollowing) {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className="px-6 py-2.5 bg-gradient-to-br from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-bold rounded-xl text-sm active:scale-95 shadow-lg shadow-[#00e5ff]/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "..." : t.profile.follow}
      </button>
    );
  }

  // Following state (includes loading when following)
  return (
    <button
      onClick={handleUnfollow}
      disabled={isLoading}
      className="px-6 py-2.5 border border-[#849396] text-[#dfe2eb] font-bold rounded-xl text-sm hover:border-rose-400 hover:text-rose-400 transition-colors disabled:opacity-50"
    >
      {isLoading ? "..." : t.profile.unfollow}
    </button>
  );
}
