"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DueDashboard from "@/components/Admin/Dues/DueDashboard";

// =========================================================
// Customer Dues Page
// =========================================================

export default function CustomerDuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check authentication and authorization
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      router.push("/auth/login");
      return;
    }

    const allowedRoles = ["admin", "superAdmin", "employee"];
    if (!allowedRoles.includes(session.user.role)) {
      router.push("/admin/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return null; // Router will handle redirect
  }

  const allowedRoles = ["admin", "superAdmin", "employee"];
  if (!allowedRoles.includes(session.user.role)) {
    return null; // Router will handle redirect
  }

  return <DueDashboard session={session} />;
}
