import { cn } from "@/lib/utils";
import "./logo.css";

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export function Logo({ className, animate = false }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-tight text-foreground select-none",
        animate && "logo-animate",
        className
      )}
      style={{ fontFamily: "var(--font-logo, Sora, sans-serif)" }}
      aria-label="HoySeVe"
    >
      H
      <svg
        className="mx-0.1 logo-eye"
        width="44"
        height="25"
        viewBox="0 0 101 66"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="logo-lid"
          d="M8.36 35.76C30.86 4.26 66.24 1.95 92.86 35.76L99.36 31.76C75.36 -7.74 25.36 -10.74 1.36 31.76L8.36 35.76Z"
          fill="currentColor"
        />
        <path
          className="logo-lid"
          d="M40.36 33.76C41.36 48.26 59.36 46.26 58.36 33.76H76.36C81.86 71.26 21.86 77.26 22.86 33.76H40.36Z"
          fill="#22D3EE"
        />
      </svg>
      ySeVe
    </span>
  );
}