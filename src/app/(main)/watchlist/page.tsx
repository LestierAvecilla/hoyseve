import { auth } from "@/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { WatchlistFilters } from "@/components/watchlist/watchlist-filters";
import { AddTitleCard } from "@/components/watchlist/add-title-card";
import { StatsSection } from "@/components/watchlist/stats-section";
import { WatchlistItemCard } from "@/components/watchlist/watchlist-item-card";
import { t } from "@/lib/i18n";

export default async function WatchlistPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const items = userId
    ? await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.userId, userId))
        .orderBy(watchlist.addedAt)
    : [];

  return (
    <div className="px-10 py-10 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-black text-5xl tracking-tighter text-foreground mb-1 uppercase">
            {t.watchlist.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t.watchlist.subtitle}
          </p>
        </div>
      </div>

      {/* ─── Filtros ─── */}
      <WatchlistFilters totalCount={items.length} />

      {/* ─── Grid de pósters ─── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-muted-foreground text-sm">{t.watchlist.empty}</p>
          <p className="text-xs text-muted-foreground/60">
            {t.watchlist.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {items.map((item) => (
            <WatchlistItemCard key={item.id} item={item} />
          ))}
          <AddTitleCard />
        </div>
      )}

      {/* ─── Stats bento inferior ─── */}
      <StatsSection />
    </div>
  );
}
