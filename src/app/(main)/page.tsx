import Image from "next/image";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  getTrending,
  posterUrl,
  backdropUrl,
  GENRE_MAP,
} from "@/lib/tmdb";
import { HeroWatchlistButton } from "@/components/home/hero-watchlist-button";
import { t } from "@/lib/i18n";

const CATEGORIES = [
  { label: t.home.categories.anime, icon: "✦", href: "/categories/anime" },
  { label: t.home.categories.movies, icon: "🎬", href: "/categories/movies" },
  { label: t.home.categories.series, icon: "🖥", href: "/categories/series" },
  { label: t.home.categories.documentaries, icon: "🌐", href: "/categories/documentaries" },
  { label: t.home.categories.kdrama, icon: "♥", href: "/categories/kdrama" },
];

export default async function HomePage() {
  const trending = await getTrending();
  const hero = trending[0];
  const top10 = trending.slice(0, 10);

  const heroGenres = hero.genre_ids
    .slice(0, 3)
    .map((id) => GENRE_MAP[id] ?? "")
    .filter(Boolean);

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── Hero Banner ─── */}
      <section className="relative min-h-[540px] flex items-end overflow-hidden">
        {/* Backdrop real */}
        {hero.backdrop_path && (
          <Image
            src={backdropUrl(hero.backdrop_path)}
            alt={hero.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}
        {/* Gradientes sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="relative z-10 px-12 pb-16 max-w-2xl">
          {/* Rating + tags */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded px-2.5 py-1">
              <span className="text-primary font-bold text-sm">
                {hero.vote_average.toFixed(1)}
              </span>
              <span className="text-primary/60 text-xs uppercase tracking-wider">
                {t.home.rating}
              </span>
            </div>
            {heroGenres.map((g) => (
              <span
                key={g}
                className="text-xs uppercase tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Título */}
          <h1 className="text-6xl font-black leading-none tracking-tight mb-6 text-foreground drop-shadow-lg">
            {hero.title}
          </h1>

          {/* Sinopsis */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md line-clamp-3">
            {hero.overview}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href={`/title/movie/${hero.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-primary/40 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/15 transition-all"
            >
              <Play size={15} fill="currentColor" />
              {t.home.viewTitle}
            </Link>
            <HeroWatchlistButton
                tmdbId={hero.id}
                mediaType="movie"
                title={hero.title}
                posterPath={hero.poster_path ?? null}
              />
          </div>
        </div>
      </section>

      {/* ─── Global Top 10 ─── */}
      <section className="px-12 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">
              {t.home.curatedCharts}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {t.home.top10Title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {top10.map((movie, i) => (
            <Link
              key={movie.id}
              href={`/title/movie/${movie.id}`}
              className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-border"
            >
              {movie.poster_path ? (
                <Image
                  src={posterUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {/* Número de ranking */}
              <div className="absolute bottom-1 left-3 text-7xl font-black text-white/10 leading-none select-none">
                {i + 1}
              </div>
              {/* Rating */}
              <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                {movie.vote_average.toFixed(1)}
              </div>
              {/* Título al hover */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-bold leading-tight line-clamp-2">
                  {movie.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Discover by Universe ─── */}
      <section className="px-12 py-14 border-t border-border">
        <div className="text-center mb-10">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-2">
            {t.home.browseDna}
          </p>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {t.home.discoverByUniverse}
          </h2>
        </div>

        <div className="flex justify-center gap-4">
          {CATEGORIES.map(({ label, icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-3 bg-card border border-border rounded-2xl px-8 py-6 w-36 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {icon}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-border px-12 py-12">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <p className="text-primary text-lg font-black mb-3">HoySeVe</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {t.home.footer.description}
            </p>
          </div>
          {[
            { title: t.home.footer.platform, links: t.home.footer.platformLinks },
            { title: t.home.footer.company, links: t.home.footer.companyLinks },
            { title: t.home.footer.community, links: t.home.footer.communityLinks },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                {title}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t.home.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            {[t.home.footer.privacy, t.home.footer.terms, t.home.footer.cookies].map((l) => (
              <Link
                key={l}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
