import { Plus } from "lucide-react";
import { t } from "@/lib/i18n";

export function AddTitleCard() {
  return (
    <div className="aspect-[2/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all cursor-pointer group">
      <Plus
        size={36}
        strokeWidth={1.5}
        className="group-hover:scale-110 transition-transform duration-200"
      />
      <span className="text-xs font-bold tracking-widest uppercase">
        {t.watchlist.addNewTitle}
      </span>
    </div>
  );
}
