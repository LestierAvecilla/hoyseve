"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRID_SIZE = 12;

function generateRandomSeed(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function generateSeedList(count: number): string[] {
  return Array.from({ length: count }, () => generateRandomSeed());
}

function diceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
}

/** Extract seed from a DiceBear URL, or return the URL itself if it's not a DiceBear URL. */
export function extractSeedFromUrl(url: string | null): string {
  if (!url) return generateRandomSeed();
  try {
    const u = new URL(url);
    if (u.hostname === "api.dicebear.com") {
      return u.searchParams.get("seed") ?? generateRandomSeed();
    }
  } catch {
    // not a valid URL
  }
  return generateRandomSeed();
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type AvatarSelectorProps = {
  /** Current avatar URL (may be a DiceBear URL or any other URL). */
  currentAvatarUrl: string | null;
  /** Called whenever the selected avatar URL changes. */
  onAvatarChange: (url: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AvatarSelector({ currentAvatarUrl, onAvatarChange }: AvatarSelectorProps) {
  const currentSeed = useRef<string>(extractSeedFromUrl(currentAvatarUrl));
  const [grid, setGrid] = useState<string[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<string>(currentSeed.current);
  const isFirstRender = useRef(true);

  // Generate initial grid only on client to avoid hydration mismatch
  useEffect(() => {
    setGrid(generateSeedList(GRID_SIZE));
  }, []);

  // Notify parent whenever selection changes (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onAvatarChange(diceBearUrl(selectedSeed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeed]);

  const handleRegenerateGrid = useCallback(() => {
    const newGrid = generateSeedList(GRID_SIZE);
    setGrid(newGrid);
  }, []);

  function handleSelect(seed: string) {
    setSelectedSeed(seed);
    currentSeed.current = seed;
    onAvatarChange(diceBearUrl(seed));
  }

  return (
    <div className="space-y-3">
      {/* Preview of selected avatar */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#00e5ff]/40 bg-[#262a31] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diceBearUrl(selectedSeed)}
            alt="Avatar seleccionado"
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs text-[#849396]">
          Avatar actual. Elegí uno nuevo de las opciones o generá más.
        </p>
      </div>

      {/* Grid header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#849396] uppercase tracking-widest font-bold">
          Opciones
        </p>
        <button
          type="button"
          onClick={handleRegenerateGrid}
          title="Generar nuevas opciones"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262a31] border border-white/10",
            "text-xs text-[#849396] hover:text-[#00e5ff] hover:border-[#00e5ff]/30",
            "transition-colors"
          )}
        >
          <RefreshCw size={14} />
          Nuevas opciones
        </button>
      </div>

      {/* Avatar grid */}
      <div className="grid grid-cols-6 gap-2">
        {grid.map((seed) => (
          <button
            key={seed}
            type="button"
            onClick={() => handleSelect(seed)}
            className={cn(
              "w-full aspect-square rounded-xl overflow-hidden border-2 transition-all",
              seed === selectedSeed
                ? "border-[#00e5ff] ring-2 ring-[#00e5ff]/20 scale-105"
                : "border-white/10 hover:border-white/30 hover:scale-105"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diceBearUrl(seed)}
              alt="Opción avatar"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
