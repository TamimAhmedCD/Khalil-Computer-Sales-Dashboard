export function DashboardSkeleton() {
  return (
    <div className="min-h-screen space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-56 rounded-2xl bg-muted/60" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted/40 border border-border/50"
          />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/40" />
        ))}
      </div>

      {/* Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-xl bg-muted/40" />
        <div className="h-96 rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}
