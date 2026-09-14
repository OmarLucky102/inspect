import { Skeleton } from "@/components/ui/skeleton";

export function LoadingRows({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-4 pt-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}