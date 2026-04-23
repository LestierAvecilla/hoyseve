"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, Bookmark, UserCircle, LogOut, Rss } from "lucide-react";
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
  const router = useRouter();
  const { data: session } = useSession();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

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

      {/* User area */}
      <div className="px-3 pb-5">
        {session?.user ? (
          <div className="space-y-2">
            {/* User info */}
            <div className="flex items-center gap-2 px-3 py-2">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={24}
                  height={24}
                  className="rounded-full border border-border flex-shrink-0"
                />
              ) : (
                <UserCircle size={20} className="text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground truncate">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider text-rose-400 hover:bg-rose-400/10 transition-all"
            >
              <LogOut size={14} />
              {t.nav.logout}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block w-full text-center text-xs font-semibold uppercase tracking-wider py-2.5 px-3 rounded-lg border border-sidebar-border text-sidebar-foreground hover:border-cyan/40 hover:text-cyan transition-all"
          >
            {t.nav.registerLogin}
          </Link>
        )}
      </div>
    </aside>
  );
}
