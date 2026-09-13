import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TableSkeletonProps {
  title?: string;
  description?: string;
  columns?: number;
  rows?: number;
  showBreadcrumb?: boolean;
  showActions?: boolean;
}

export function TableSkeleton({
  title,
  description,
  columns = 5,
  rows = 7,
  showBreadcrumb = true,
  showActions = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Breadcrumb Skeleton */}
      {showBreadcrumb && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-24" />
        </div>
      )}

      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          ) : (
            <Skeleton className="h-8 w-48 sm:w-64" />
          )}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            <Skeleton className="h-4 w-60 sm:w-80" />
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 sm:w-32 rounded-md" />
            <Skeleton className="h-9 w-28 sm:w-36 rounded-md" />
          </div>
        )}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full sm:max-w-md items-center gap-2">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Table Card Skeleton */}
      <Card className="border border-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full divide-y divide-border/60">
            {/* Table Header */}
            <div className="bg-muted/40 px-4 py-3 flex items-center justify-between gap-4">
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="flex-1">
                  <Skeleton className="h-4 w-3/4 max-w-[120px]" />
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/40 bg-card">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="px-4 py-3.5 flex items-center justify-between gap-4"
                >
                  {/* First Column: Avatar/Icon + Name */}
                  <div className="flex-1 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/4 max-w-[140px]" />
                      <Skeleton className="h-2.5 w-1/2 max-w-[90px]" />
                    </div>
                  </div>

                  {/* Middle Columns */}
                  {Array.from({ length: columns - 2 }).map((_, colIndex) => (
                    <div key={colIndex} className="flex-1 hidden sm:block">
                      <Skeleton
                        className={`h-3.5 ${
                          colIndex % 2 === 0 ? "w-2/3 max-w-[110px]" : "w-1/2 max-w-[80px]"
                        }`}
                      />
                    </div>
                  ))}

                  {/* Last Column: Badge or Action */}
                  <div className="flex-1 flex justify-end">
                    <Skeleton className="h-6 w-16 sm:w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-4 py-3 bg-muted/20 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-4 w-32 sm:w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}
