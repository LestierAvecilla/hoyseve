"use client";

import { useState } from "react";

interface DetailTabsProps {
  infoLabel: string;
  trailerLabel: string;
  infoContent: React.ReactNode;
  trailerContent: React.ReactNode;
  defaultTab?: "info" | "trailer";
}

const TABS = [
  { key: "info" as const },
  { key: "trailer" as const },
];

type TabKey = (typeof TABS)[number]["key"];

export function DetailTabs({
  infoLabel,
  trailerLabel,
  infoContent,
  trailerContent,
  defaultTab = "info",
}: DetailTabsProps) {
  const [current, setCurrent] = useState<TabKey>(defaultTab);

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-8 border-b border-border">
        <button
          onClick={() => setCurrent("info")}
          className={
            current === "info"
              ? "pb-4 text-sm font-bold uppercase tracking-widest text-primary border-b-2 border-primary"
              : "pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          {infoLabel}
        </button>
        <button
          onClick={() => setCurrent("trailer")}
          className={
            current === "trailer"
              ? "pb-4 text-sm font-bold uppercase tracking-widest text-primary border-b-2 border-primary"
              : "pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          {trailerLabel}
        </button>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {current === "info" ? infoContent : trailerContent}
      </div>
    </>
  );
}
