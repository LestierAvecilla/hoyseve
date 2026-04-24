"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, UserCircle, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Logo } from "@/components/shared/logo";

const navItems = [
  { href: "/", label: t.nav.home, icon: Home },
  { href: "/feed", label: t.nav.feed, icon: Rss },
  { href: "/watchlist", label: t.nav.watchlist, icon: Bookmark },
  { href: "/profile", label: t.nav.profile, icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[160px] flex flex-col bg-sidebar border-r border-sidebar-border z-40">
      {/* Logo */}
      <div className="px-2 py-6 border-b border-sidebar-border">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Logo className="text-2xl" animate />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                isActive
                  ? "bg-cyan/10 text-cyan border border-cyan/20"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
