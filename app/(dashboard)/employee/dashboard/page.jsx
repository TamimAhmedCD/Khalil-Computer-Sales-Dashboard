"use client";
import { EmployeeDashboardEnhanced } from "@/components/Employee/DashboardEnhanced";
import { DashboardSkeleton } from "@/components/Employee/Dashboard/DashboardSkeleton";
import { useSession } from "next-auth/react";

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <DashboardSkeleton />;
  }
  if (status === "unauthenticated") {
    return <div>Not logged in</div>;
  }
  if (session.user.role !== "employee") {
    return <div>Unauthorized</div>;
  }
  return (
    <section>
      <EmployeeDashboardEnhanced session={session} />
    </section>
  );
}
