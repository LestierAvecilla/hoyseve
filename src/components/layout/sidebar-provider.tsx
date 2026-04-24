"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sidebar-collapsed";
const WIDTH_EXPANDED = 160;
const WIDTH_COLLAPSED = 80;

interface SidebarContextValue {
  isCollapsed: boolean;
  sidebarWidth: number;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  // Sync CSS variable on every change
  useEffect(() => {
    const width = isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED;
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
  }, [isCollapsed]);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const sidebarWidth = isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED;

  return (
    <SidebarContext.Provider value={{ isCollapsed, sidebarWidth, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
