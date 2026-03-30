"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, Film, Tv, Sparkles, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface SearchResult {
  id: number;
  source: "tmdb" | "anilist";
  media_type: "movie" | "tv" | "anime";
  title: string;
  poster_url: string | null;
  year: number | null;
}

export function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(id: number, mediaType: "movie" | "tv" | "anime", source: "tmdb" | "anilist") {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(source === "anilist" ? `/anime/${id}` : `/title/${mediaType}/${id}`);
  }

  return (
    <header className="fixed top-0 left-[160px] right-0 h-14 flex items-center justify-between px-6 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Buscador con dropdown */}
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex items-center gap-2.5 bg-input rounded-full px-4 py-2 w-72 border transition-colors",
            isOpen ? "border-cyan/40 rounded-b-none rounded-t-2xl border-b-transparent" : "border-border focus-within:border-cyan/40"
          )}
        >
          {isLoading ? (
            <Loader2 size={14} className="text-muted-foreground flex-shrink-0 animate-spin" />
          ) : (
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={t.search.placeholder}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* Dropdown de resultados */}
        {isOpen && (
          <div className="absolute top-full left-0 w-72 bg-input border border-cyan/40 border-t-0 rounded-b-2xl overflow-hidden shadow-2xl shadow-black/50 z-50">
            {results.length === 0 && !isLoading ? (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                {t.search.noResults}
              </div>
            ) : (
              <ul>
                {results.map((r) => (
                  <li key={`${r.media_type}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r.id, r.media_type, r.source)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      {/* Poster pequeño */}
                      <div className="w-8 h-11 rounded flex-shrink-0 overflow-hidden bg-card border border-border relative">
                        {r.poster_url ? (
                          <Image
                            src={r.poster_url}
                            alt={r.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {r.media_type === "movie" ? (
                            <Film size={10} className="text-primary flex-shrink-0" />
                          ) : r.media_type === "anime" ? (
                            <Sparkles size={10} className="text-primary flex-shrink-0" />
                          ) : (
                            <Tv size={10} className="text-primary flex-shrink-0" />
                          )}
                          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                            {r.media_type === "movie" ? t.search.movie : r.media_type === "anime" ? t.anime.title : t.search.tv}
                          </span>
                          {r.year && (
                            <span className="text-[10px] text-muted-foreground">
                              • {r.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Auth area */}
      <div className="flex items-center gap-3">
        {session?.user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={30}
                height={30}
                className="rounded-full border border-border"
              />
            ) : (
              <UserCircle size={26} className="text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
              {session.user.name ?? session.user.email}
            </span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              {t.login.tabLogin}
            </Link>
            <Link
              href="/login?tab=register"
              className={cn(
                "inline-flex items-center justify-center px-5 py-1.5 rounded-full",
                "text-xs font-semibold uppercase tracking-wider",
                "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              )}
            >
              {t.login.tabRegister}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
