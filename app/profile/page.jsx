"use client";

import { useSession } from "next-auth/react";
import { ProfileSettings } from "@/components/Profile/ProfileSettings";
import { SystemPreferences } from "@/components/Profile/SystemPreferences";
import { Loader2, User, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Not logged in</h1>
        <p className="mt-2 text-muted-foreground">Please log in to access your profile settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {session?.user?.role || "User"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with User Info */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-3xl border-4 border-primary/20">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold tracking-tight">{session?.user?.name}</h2>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium capitalize">
                  {session?.user?.role || "User"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
              <ProfileSettings session={session} />
            </TabsContent>
            <TabsContent value="preferences" className="space-y-4">
              <SystemPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
