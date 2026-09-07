"use client";

import { useState, useEffect } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Bell,
  Globe,
  Type,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIME_ZONES = [
  { value: "Asia/Dhaka", label: "Dhaka (UTC+6)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Kolkata", label: "Kolkata (UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
];

export function SystemPreferences() {
  const [activeTab, setActiveTab] = useState("appearance");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    timezone: "Asia/Dhaka",
    dateFormat: "MM/DD/YYYY",
    notificationEmail: true,
    notificationDesktop: true,
    notificationSMS: false,
    showWelcomeTip: true,
    compactMode: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleChange = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Save preferences error:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "appearance", label: "Appearance", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "region", label: "Region & Language", icon: Globe },
    { id: "formatting", label: "Formatting", icon: Type },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Preferences</h1>
          <p className="text-muted-foreground">
            Customize your workspace and notification settings
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Changes are saved automatically</span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="flex md:flex-col gap-1 md:w-56 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Theme Settings
                  </CardTitle>
                  <CardDescription>
                    Choose how the application looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={preferences.theme}
                    onValueChange={(value) => handleChange("theme", value)}
                    className="grid gap-4 md:grid-cols-3"
                  >
                    <div>
                      <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                      <Label
                        htmlFor="theme-light"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary md:p-4 md:w-48 cursor-pointer"
                      >
                        <Sun className="mb-2 h-6 w-6 text-amber-500" />
                        <span className="font-medium">Light</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary md:p-4 md:w-48 cursor-pointer"
                      >
                        <Moon className="mb-2 h-6 w-6 text-blue-500" />
                        <span className="font-medium">Dark</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                      <Label
                        htmlFor="theme-system"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary md:p-4 md:w-48 cursor-pointer"
                      >
                        <Monitor className="mb-2 h-6 w-6 text-muted-foreground" />
                        <span className="font-medium">System</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Interface Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compactMode">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Reduce spacing and sizes for a denser interface
                      </p>
                    </div>
                    <Switch
                      id="compactMode"
                      checked={preferences.compactMode}
                      onCheckedChange={(checked) => handleChange("compactMode", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showWelcomeTip">Show Welcome Tip</Label>
                      <p className="text-xs text-muted-foreground">
                        Display helpful tips on first load
                      </p>
                    </div>
                    <Switch
                      id="showWelcomeTip"
                      checked={preferences.showWelcomeTip}
                      onCheckedChange={(checked) => handleChange("showWelcomeTip", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-muted/50">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive important updates via email
                          </p>
                        </div>
                        <Switch
                          checked={preferences.notificationEmail}
                          onCheckedChange={(checked) => handleChange("notificationEmail", checked)}
                        />
                      </div>
                      <div className="pl-12 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Sales alerts</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Commission updates</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">System notifications</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border border-muted/50">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Monitor className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Desktop Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Show pop-up alerts in your browser
                          </p>
                        </div>
                        <Switch
                          checked={preferences.notificationDesktop}
                          onCheckedChange={(checked) => handleChange("notificationDesktop", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Region & Language Tab */}
          {activeTab === "region" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Region & Language
                </CardTitle>
                <CardDescription>
                  Customize your regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => handleChange("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => handleChange("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_ZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <Label>Current Time</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZoneName: "short",
                      })}
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formatting Tab */}
          {activeTab === "formatting" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Number & Date Formatting
                </CardTitle>
                <CardDescription>
                  Choose how numbers and dates appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <RadioGroup
                    value={preferences.dateFormat}
                    onValueChange={(value) => handleChange("dateFormat", value)}
                    className="grid gap-4 sm:grid-cols-3"
                  >
                    <div>
                      <RadioGroupItem value="MM/DD/YYYY" id="date-mdy" className="peer sr-only" />
                      <Label
                        htmlFor="date-mdy"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary p-4 cursor-pointer"
                      >
                        <span className="font-medium mb-1">US Format</span>
                        <span className="text-sm">09/07/2026</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="DD/MM/YYYY" id="date-dmy" className="peer sr-only" />
                      <Label
                        htmlFor="date-dmy"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary p-4 cursor-pointer"
                      >
                        <span className="font-medium mb-1">International</span>
                        <span className="text-sm">07/09/2026</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="YYYY-MM-DD" id="date-iso" className="peer sr-only" />
                      <Label
                        htmlFor="date-iso"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary p-4 cursor-pointer"
                      >
                        <span className="font-medium mb-1">ISO</span>
                        <span className="text-sm">2026-09-07</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Format</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <span className="font-medium">BDT (৳)</span>
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-muted/50 opacity-50 cursor-not-allowed">
                      <span className="font-medium">USD ($)</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-muted/50 opacity-50 cursor-not-allowed">
                      <span className="font-medium">EUR (€)</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currency format is set by admin
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
