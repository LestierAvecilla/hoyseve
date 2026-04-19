"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

interface ProfileTabsProps {
  ratingsContent: React.ReactNode;
  watchlistContent: React.ReactNode;
  reviewsContent: React.ReactNode;
  /** When provided, tab labels use "de {username}" form (public profile).
   *  When omitted, defaults to "Mis..." form (own profile). */
  username?: string;
}

export function ProfileTabs({ ratingsContent, watchlistContent, reviewsContent, username }: ProfileTabsProps) {
  const ownProfile = !username;

  const labels = {
    ratings: ownProfile ? t.profile.tabs.ratings : `Valoraciones de ${username}`,
    reviews: ownProfile ? t.profile.tabs.reviews : `Reseñas de ${username}`,
    watchlist: ownProfile ? t.profile.tabs.watchlist : `Lista de ${username}`,
  };

  const TABS = [
    { key: "ratings" as const, label: labels.ratings },
    { key: "reviews" as const, label: labels.reviews },
    { key: "watchlist" as const, label: labels.watchlist },
  ];
  type TabKey = (typeof TABS)[number]["key"];

  const [current, setCurrent] = useState<TabKey>("ratings");

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-8 border-b border-white/5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrent(key)}
            className={
              current === key
                ? "pb-4 text-sm font-bold text-[#00e5ff] border-b-2 border-[#00e5ff]"
                : "pb-4 text-sm font-medium text-[#bac9cc] hover:text-[#dfe2eb] transition-colors"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-8">
        {current === "ratings" ? (
          ratingsContent
        ) : current === "reviews" ? (
          reviewsContent
        ) : (
          watchlistContent
        )}
      </div>
    </>
  );
}
