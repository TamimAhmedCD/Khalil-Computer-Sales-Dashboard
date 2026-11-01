"use client";

import { useSession } from "next-auth/react";
import DueDashboard from "@/components/Admin/Dues/DueDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDuesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session?.user?.id || !(session.user.role === "admin" || session.user.role === "superAdmin")) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-xl font-bold text-destructive">Unauthorized Access</h1>
        <p className="text-sm text-muted-foreground mt-2">You do not have permission to view customer dues.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DueDashboard />
    </div>
  );
}
