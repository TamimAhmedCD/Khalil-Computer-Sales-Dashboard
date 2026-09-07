"use client";

import { useSession } from "next-auth/react";
import { AdminSettings } from "@/components/Admin/Settings/AdminSettings";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <div className="p-6">Not logged in</div>;
  }

  if (session?.user?.role !== "admin" && session?.user?.role !== "superAdmin") {
    return <div className="p-6">Unauthorized</div>;
  }

  return <AdminSettings session={session} />;
}
