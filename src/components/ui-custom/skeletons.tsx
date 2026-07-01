import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-lg", className)} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card flex items-start justify-between p-unit-md">
      <div className="w-full space-y-3">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-8 w-16" />
        <Shimmer className="h-3 w-28" />
      </div>
      <Shimmer className="size-11 rounded-xl" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Shimmer className="h-4 w-full max-w-32" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card space-y-4 p-unit-md", className)}>
      <Shimmer className="h-4 w-1/3" />
      <Shimmer className="h-24 w-full" />
      <Shimmer className="h-4 w-1/2" />
    </div>
  );
}

export function AvatarLineSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Shimmer className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export { Shimmer };
