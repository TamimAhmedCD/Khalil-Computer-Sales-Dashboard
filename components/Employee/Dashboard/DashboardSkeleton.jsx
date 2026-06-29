export function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="h-40 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl w-full" />

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
          />
        ))}
      </div>

      {/* Quick Action Buttons Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg"
          />
        ))}
      </div>

      {/* Main Content Splitted Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg" />
        <div className="h-80 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg" />
      </div>
    </div>
  );
}
