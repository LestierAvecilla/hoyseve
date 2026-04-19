"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#1c2026",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#dfe2eb",
          },
        }}
      />
    </SessionProvider>
  );
}
