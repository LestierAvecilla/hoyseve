"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

const TABS = [
  t.profile.tabs.ratings,
  t.profile.tabs.reviews,
  t.profile.tabs.watchlist,
  t.profile.tabs.settings,
] as const;
type Tab = (typeof TABS)[number];

interface ProfileTabsProps {
  ratingsContent: React.ReactNode;
  watchlistContent: React.ReactNode;
  reviewsContent: React.ReactNode;
}

export function ProfileTabs({ ratingsContent, watchlistContent, reviewsContent }: ProfileTabsProps) {
  const [current, setCurrent] = useState<Tab>(t.profile.tabs.ratings);

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-8 border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrent(tab)}
            className={
              current === tab
                ? "pb-4 text-sm font-bold text-[#00e5ff] border-b-2 border-[#00e5ff]"
                : "pb-4 text-sm font-medium text-[#bac9cc] hover:text-[#dfe2eb] transition-colors"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-8">
        {current === t.profile.tabs.ratings ? (
          ratingsContent
        ) : current === t.profile.tabs.reviews ? (
          reviewsContent
        ) : current === t.profile.tabs.watchlist ? (
          watchlistContent
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-muted-foreground text-sm font-medium">{current}</p>
            <p className="text-xs text-muted-foreground/50">{t.profile.comingSoon}</p>
          </div>
        )}
      </div>
    </>
  );
}
