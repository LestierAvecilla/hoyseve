import { Star, Clapperboard, TrendingUp } from "lucide-react";
import { t } from "@/lib/i18n";

interface MetricsSectionProps {
  totalWatched: number;
  avgRating: number | null;
  topGenre: string | null;
}

export function MetricsSection({ totalWatched, avgRating, topGenre }: MetricsSectionProps) {
  const metrics = [
    {
      icon: Clapperboard,
      value: String(totalWatched),
      label: t.profile.totalWatched,
    },
    {
      icon: Star,
      value: avgRating !== null ? avgRating.toFixed(1) : "—",
      label: t.profile.avgRating,
    },
    {
      icon: TrendingUp,
      value: topGenre ?? "—",
      label: t.profile.topGenre,
    },
  ];

  return (
    <section className="px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/20 flex items-center justify-center">
          <span className="text-[#00e5ff] text-lg">📊</span>
        </div>
        <h3 className="text-xl font-black text-[#dfe2eb]">{t.profile.metrics}</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-[#1c2026] p-4 rounded-2xl border border-white/[0.03] text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-[#262a31] mx-auto mb-3 flex items-center justify-center text-[#00e5ff]">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-black text-[#dfe2eb] leading-none mb-1 truncate">
              {value}
            </p>
            <p className="text-[0.6875rem] uppercase tracking-widest text-[#849396] truncate">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
