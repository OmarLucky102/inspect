import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPanelProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorPanel({
  title = "Unable to load this record",
  message = "The registry did not return usable data.",
  onRetry,
}: ErrorPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-seal/30 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <RotateCcw className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg text-destructive">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}