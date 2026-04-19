"use client";

import { useState, useCallback } from "react";
import { ProfileTabs } from "./profile-tabs";
import { FollowersDrawer } from "./followers-drawer";
import { FollowingDrawer } from "./following-drawer";
import { ProfileHeader } from "./profile-header";

interface PublicProfileClientProps {
  ratingsContent: React.ReactNode;
  watchlistContent: React.ReactNode;
  reviewsContent: React.ReactNode;
  /** Username (handle) for tab labels in public profiles.
   *  Omit for own profile (tabs will show "Mis..." labels). */
  username?: string;
  // Drawer-related props
  userId: string;
  currentUserId: string | null;
  initialFollowersCount: number;
  initialFollowingCount: number;
  // ProfileHeader props (passed through to allow count updates)
  name: string | null;
  email: string;
  userHandle: string | null;
  image: string | null;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
  createdAt: Date | null;
  // Sections rendered between header and tabs
  hallOfFameContent: React.ReactNode;
  metricsContent: React.ReactNode;
}

export function PublicProfileClient({
  ratingsContent,
  watchlistContent,
  reviewsContent,
  username,
  userId,
  currentUserId,
  initialFollowersCount,
  initialFollowingCount,
  name,
  email,
  userHandle,
  image,
  isOwnProfile,
  initialIsFollowing,
  createdAt,
  hallOfFameContent,
  metricsContent,
}: PublicProfileClientProps) {
  const [drawerOpen, setDrawerOpen] = useState<"followers" | "following" | null>(null);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);

  const handleCountClick = useCallback((type: "followers" | "following") => {
    setDrawerOpen(type);
  }, []);

  const handleFollowersCountChange = useCallback((delta: number) => {
    setFollowersCount((prev) => Math.max(0, prev + delta));
  }, []);

  const handleFollowingCountChange = useCallback((delta: number) => {
    setFollowingCount((prev) => Math.max(0, prev + delta));
  }, []);

  return (
    <>
      {/* ProfileHeader — always first */}
      <ProfileHeader
        userId={userId}
        name={name}
        email={email}
        username={userHandle}
        image={image}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={initialIsFollowing}
        followersCount={followersCount}
        followingCount={followingCount}
        createdAt={createdAt}
        onCountClick={handleCountClick}
      />

      {/* Hall of Fame + Metrics — between header and tabs */}
      {hallOfFameContent}
      {metricsContent}

      {/* Sticky Tab Bar */}
      <section className="px-8 sticky top-14 z-30 bg-[#10141a]/90 backdrop-blur-md">
        <ProfileTabs
          ratingsContent={ratingsContent}
          watchlistContent={watchlistContent}
          reviewsContent={reviewsContent}
          username={username}
        />
      </section>

      <FollowersDrawer
        userId={userId}
        currentUserId={currentUserId}
        open={drawerOpen === "followers"}
        onOpenChange={(open) => setDrawerOpen(open ? "followers" : null)}
        onCountChange={handleFollowersCountChange}
      />

      <FollowingDrawer
        userId={userId}
        currentUserId={currentUserId}
        open={drawerOpen === "following"}
        onOpenChange={(open) => setDrawerOpen(open ? "following" : null)}
        onCountChange={handleFollowingCountChange}
      />
    </>
  );
}
