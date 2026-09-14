import { cn } from "@/lib/utils";

type WordmarkTone = "ink" | "chrome";

interface WordmarkProps {
  tone?: WordmarkTone;
  className?: string;
}

export function Wordmark({ tone = "ink", className }: WordmarkProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span
        className={cn(
          "font-display text-2xl font-semibold tracking-tight leading-none",
          tone === "ink" ? "text-foreground" : "text-chrome-foreground",
        )}
      >
        Inspect
      </span>
      <span
        className={cn(
          "eyebrow font-mono",
          tone === "ink" ? "text-muted-foreground" : "text-chrome-muted",
        )}
      >
        Control of the institution
      </span>
    </div>
  );
}