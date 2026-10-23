"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CustomerDashboard from "@/components/Admin/Customers/CustomerDashboard";
import { CustomerList } from "@/components/Admin/Customers/CustomerList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading customer management...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.role || !["admin", "superAdmin"].includes(session.user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3 0a9 9 0 110-18 9 9 0 010 18z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold">Unauthorized Access</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have permission to view this page. Admin access required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage customers, view profiles, and track customer history
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="all">All Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CustomerDashboard />
        </TabsContent>

        <TabsContent value="all">
          <CustomerList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
