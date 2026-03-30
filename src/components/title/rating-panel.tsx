"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface RatingPanelProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export function RatingPanel({ tmdbId, mediaType }: RatingPanelProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [score, setScore] = useState(8);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing rating on mount
  useEffect(() => {
    if (status !== "authenticated") { setLoaded(true); return; }
    fetch(`/api/ratings?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.score) {
          setScore(data.score);
          setReview(data.review ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [status, tmdbId, mediaType]);

  async function handleSubmit() {
    if (!session) {
      router.push(`/login?callbackUrl=/title/${mediaType}/${tmdbId}`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, mediaType, score, review }),
      });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? t.title.failedToSubmit);
          return;
        }
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch {
      setError(t.title.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  // Color del score según valor
  const scoreColor =
    score >= 8
      ? "text-emerald-400"
      : score >= 6
        ? "text-yellow-400"
        : "text-rose-400";

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl space-y-6">
      {/* Header */}
      <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
        <Star size={16} className="text-primary fill-primary" />
        {t.title.rateTitle}
      </h3>

      {/* Unauthenticated prompt */}
      {status === "unauthenticated" && (
        <p className="text-xs text-muted-foreground text-center py-2">
          <button
            onClick={() => router.push(`/login?callbackUrl=/title/${mediaType}/${tmdbId}`)}
            className="text-primary hover:underline"
          >
            {t.title.signInToRateInline}
          </button>{" "}
          {t.title.signInToRateSuffix}
        </p>
      )}

      {/* Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {t.title.yourRating}
          </span>
          <span className={cn("text-2xl font-black leading-none", scoreColor)}>
            {score}
          </span>
        </div>

        <Slider
          min={1}
          max={10}
          value={[score]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val;
            setScore(v as number);
          }}
          className="w-full"
          disabled={status === "unauthenticated" || !loaded}
        />

        <div className="flex justify-between px-0.5">
          {["1", "5", "10"].map((n) => (
            <span key={n} className="text-[9px] font-bold text-muted-foreground/50">
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Review textarea */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">
          {t.title.addReviewOptional}
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder={t.title.reviewPlaceholder}
          rows={4}
          disabled={status === "unauthenticated" || !loaded}
          className={cn(
            "w-full bg-muted/40 border border-border rounded-xl px-4 py-3",
            "text-sm text-foreground placeholder:text-muted-foreground/40",
            "focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30",
            "transition-all resize-none disabled:opacity-50"
          )}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !loaded}
        className={cn(
          "w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95",
          submitted
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20",
          (submitting || !loaded) && "opacity-60 cursor-not-allowed"
        )}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" /> {t.title.submitting}
          </span>
        ) : submitted ? (
          t.title.scoreSaved
        ) : status === "unauthenticated" ? (
          t.title.signInToRate
        ) : (
          t.title.submitScore
        )}
      </button>
    </div>
  );
}
