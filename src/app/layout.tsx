import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "HoySeVe — Cinematic Curator",
  description: "Califica, reseña y descubre películas, series y anime en comunidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${sora.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
