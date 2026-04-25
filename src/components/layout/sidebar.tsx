"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, UserCircle, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Logo } from "@/components/shared/logo";
import { useSidebar } from "@/components/layout/sidebar-provider";
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPositioner,
  TooltipPopup,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: t.nav.home, icon: Home },
  { href: "/feed", label: t.nav.feed, icon: Rss },
  { href: "/watchlist", label: t.nav.watchlist, icon: Bookmark },
  { href: "/profile", label: t.nav.profile, icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed } = useSidebar();
  const sidebarRef = useRef<HTMLElement>(null);

  // Collapse when clicking outside the sidebar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setCollapsed(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setCollapsed]);

  return (
    <TooltipProvider>
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border z-40",
          "transition-[width] duration-300 ease-out overflow-hidden",
          isCollapsed ? "w-20 cursor-pointer" : "w-[160px]"
        )}
        onClick={() => {
          if (isCollapsed) setCollapsed(false);
        }}
      >
        {/* Logo */}
        <div className="w-full px-2 py-6 border-b border-sidebar-border flex justify-center">
          <Link
            href="/"
            className="inline-block hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (isCollapsed) {
                e.preventDefault();
                setCollapsed(false);
              } else {
                e.stopPropagation();
              }
            }}
          >
            {isCollapsed ? (
              <Logo className="text-2xl" collapsed animate />
            ) : (
              <Logo className="text-2xl" animate />
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <TooltipRoot key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                        isCollapsed && "justify-center px-0 py-3",
                        isActive
                          ? "bg-cyan/10 text-cyan border border-cyan/20"
                          : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                      {!isCollapsed && <span>{label}</span>}
                    </Link>
                  }
                />
                {isCollapsed && (
                  <TooltipPositioner side="right">
                    <TooltipPopup>{label}</TooltipPopup>
                  </TooltipPositioner>
                )}
              </TooltipRoot>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
