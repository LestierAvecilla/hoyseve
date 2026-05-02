import Image from "next/image";
import { StreamingProvider } from "@/lib/tmdb";

interface StreamingPlatformsProps {
  providers: StreamingProvider[];
  label?: string;
  className?: string;
}

export function StreamingPlatforms({
  providers,
  label,
  className,
}: StreamingPlatformsProps) {
  if (!providers || providers.length === 0) return null;

  const visibleProviders = providers.slice(0, 6);
  const overflowCount = providers.length - 6;

  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ""}`}>
      {label && (
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </span>
      )}
      {visibleProviders.map((provider) => (
        <span
          key={provider.providerId}
          className="group relative"
        >
          <Image
            src={provider.logoPath}
            alt={provider.providerName}
            width={32}
            height={32}
            className="rounded-sm"
          />
          {/* Tooltip */}
          <span
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5
                       px-3 py-1.5 text-xs font-medium
                       bg-popover text-popover-foreground
                       rounded-lg shadow-xl
                       border border-primary/20
                       opacity-0 group-hover:opacity-100
                       transition-all duration-200
                       translate-y-1 group-hover:translate-y-0
                       pointer-events-none
                       whitespace-nowrap
                       z-50
                       before:content-[''] before:absolute before:top-full before:left-1/2
                       before:-translate-x-1/2 before:border-4
                       before:border-transparent before:border-t-popover"
          >
            {provider.providerName}
          </span>
        </span>
      ))}
      {overflowCount > 0 && (
        <span className="text-xs font-semibold text-muted-foreground">
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
