"use client";

import Image from "next/image";
import { UserCircle2 } from "lucide-react";
import { FollowButton } from "./follow-button";

export interface FollowerUser {
  id: string;
  name: string | null;
  handle: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

interface UserCardProps {
  user: FollowerUser;
  currentUserId: string | null;
  onFollowChange: (userId: string, nowFollowing: boolean) => void;
}

export function UserCard({ user, currentUserId, onFollowChange }: UserCardProps) {
  const isOwnCard = currentUserId === user.id;

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-[#181c22] transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#262a31] flex-shrink-0 flex items-center justify-center border border-[#00e5ff]/10">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name ?? user.handle}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <UserCircle2 size={24} className="text-[#849396]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#dfe2eb] font-semibold text-sm truncate leading-none">
          {user.name ?? user.handle}
        </p>
        <p className="text-[#849396] text-xs mt-0.5">@{user.handle}</p>
      </div>

      {/* Follow button — hidden for own card */}
      {!isOwnCard && (
        <div className="flex-shrink-0">
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={user.isFollowing}
            isOwnProfile={false}
            onFollowChange={(nowFollowing) => onFollowChange(user.id, nowFollowing)}
          />
        </div>
      )}
    </div>
  );
}
