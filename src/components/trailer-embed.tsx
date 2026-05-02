"use client";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { t } from "@/lib/i18n";

interface TrailerEmbedProps {
  videoId: string | null | undefined;
  title?: string;
}

export function TrailerEmbed({ videoId, title }: TrailerEmbedProps) {
  if (!videoId) {
    return (
      <p className="text-muted-foreground text-center py-12 text-sm">
        {t.anime.noTrailer}
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <LiteYouTubeEmbed id={videoId} title={title ?? "Trailer"} />
    </div>
  );
}
