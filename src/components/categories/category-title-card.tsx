import Image from "next/image";
import Link from "next/link";

interface CategoryTitleCardProps {
  href: string;
  title: string;
  subtitle: string;
  rating: string;
  posterUrl: string | null;
  disabled?: boolean;
}

const FALLBACK_GRADIENTS = [
  "from-cyan-900 via-teal-950 to-slate-950",
  "from-indigo-900 via-blue-950 to-slate-950",
  "from-violet-900 via-purple-950 to-slate-950",
  "from-rose-900 via-red-950 to-slate-950",
  "from-amber-900 via-orange-950 to-slate-950",
  "from-emerald-900 via-green-950 to-slate-950",
];

export function CategoryTitleCard({
  href,
  title,
  subtitle,
  rating,
  posterUrl,
  disabled = false,
}: CategoryTitleCardProps) {
  const fallback = FALLBACK_GRADIENTS[title.length % FALLBACK_GRADIENTS.length];

  const content = (
    <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden border border-border bg-card shadow-xl transition-all duration-300 ${disabled ? "opacity-90" : "hover:-translate-y-2 hover:shadow-primary/10"}`}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${fallback}`} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
          {rating}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{title}</p>
          <p className="text-primary text-[0.6875rem] uppercase tracking-wide mt-1 line-clamp-2">
            {subtitle}
          </p>
        </div>
      </div>
  );

  if (disabled) {
    return <div className="group block cursor-default">{content}</div>;
  }

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  );
}
