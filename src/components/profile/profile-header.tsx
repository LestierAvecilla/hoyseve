"use client";

import Image from "next/image";
import { BadgeCheck, UserCircle2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { FollowButton } from "./follow-button";

interface ProfileHeaderProps {
  userId: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: Date | null;
  onCountClick?: (type: "followers" | "following") => void;
}

function formatJoinDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function ProfileHeader({
  userId,
  name,
  email,
  username,
  image,
  isOwnProfile,
  initialIsFollowing,
  followersCount,
  followingCount,
  createdAt,
  onCountClick,
}: ProfileHeaderProps) {
  const emailHandle = email.split("@")[0];
  const displayHandle = username ?? emailHandle;
  const joinDate = createdAt ? formatJoinDate(createdAt) : null;

  return (
    <section className="pb-8 px-8">
      <div className="relative rounded-3xl overflow-hidden bg-[#181c22] p-8 mt-6">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00e5ff]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-end gap-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-2 border-[#00e5ff]/20 shadow-2xl bg-[#262a31] flex items-center justify-center">
              {image ? (
                <Image
                  src={image}
                  alt={name ?? emailHandle}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <UserCircle2 size={72} className="text-[#849396]" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black tracking-tighter text-[#dfe2eb] truncate">
                  {name ?? emailHandle}
                </h2>
                <BadgeCheck size={22} className="text-[#00e5ff] flex-shrink-0" />
              </div>
              <p className="text-[#849396] font-medium text-sm">
                @{displayHandle}
                {joinDate && ` • ${t.profile.joinedSince} ${joinDate}`}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-2">
              <button
                type="button"
                onClick={() => onCountClick?.("followers")}
                className="flex items-center gap-3 group cursor-pointer"
                aria-label={`Ver seguidores: ${followersCount}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#262a31] flex items-center justify-center text-[#00e5ff]">
                  <span className="text-lg font-black">♥</span>
                </div>
                <div>
                  <p className="text-xl font-bold leading-none text-[#dfe2eb] group-hover:text-[#00e5ff] transition-colors">
                    {followersCount}
                  </p>
                  <p className="text-[0.6875rem] uppercase tracking-widest text-[#849396]">
                    {t.profile.followers}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onCountClick?.("following")}
                className="flex items-center gap-3 group cursor-pointer"
                aria-label={`Ver siguiendo: ${followingCount}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#262a31] flex items-center justify-center text-[#00e5ff]">
                  <span className="text-lg font-black">→</span>
                </div>
                <div>
                  <p className="text-xl font-bold leading-none text-[#dfe2eb] group-hover:text-[#00e5ff] transition-colors">
                    {followingCount}
                  </p>
                  <p className="text-[0.6875rem] uppercase tracking-widest text-[#849396]">
                    {t.profile.following}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Follow Button */}
          <div className="flex gap-3 flex-shrink-0">
            <FollowButton
              targetUserId={userId}
              initialIsFollowing={initialIsFollowing}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
