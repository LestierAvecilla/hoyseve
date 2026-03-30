import { Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";

// Avatares placeholder para "recently completed"
const RECENTLY_COMPLETED_GRADIENTS = [
  "from-cyan-900 to-slate-900",
  "from-orange-900 to-slate-900",
  "from-purple-900 to-slate-900",
];

export function StatsSection() {
  return (
    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Viewing Insights — 2/3 */}
      <div className="md:col-span-2 bg-card rounded-xl p-8 border border-border flex flex-col justify-between min-h-[220px]">
        <div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-4 block">
            {t.watchlist.stats.insightsLabel}
          </span>
          <h4 className="font-bold text-3xl text-foreground mb-2 tracking-tight">
            {t.watchlist.stats.insightsHeading}
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
            {t.watchlist.stats.insightsBody}
          </p>
        </div>

        {/* Avatares apilados */}
        <div className="flex items-center gap-3 mt-8">
          <div className="flex -space-x-3">
            {RECENTLY_COMPLETED_GRADIENTS.map((g, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full border-2 border-background bg-gradient-to-b ${g} flex-shrink-0`}
              />
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">
              +2
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t.watchlist.stats.recentlyCompleted}
          </span>
        </div>
      </div>

      {/* AI Curator — 1/3 */}
      <div className="bg-gradient-to-br from-card to-background rounded-xl p-8 border border-border flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={28} className="text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-lg text-foreground mb-1">{t.watchlist.stats.aiCurator}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.watchlist.stats.aiCuratorBody}
          </p>
        </div>
        <button className="w-full py-2.5 border border-primary/40 text-primary text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-primary/10 transition-colors">
          {t.watchlist.stats.generatePicks}
        </button>
      </div>
    </div>
  );
}
