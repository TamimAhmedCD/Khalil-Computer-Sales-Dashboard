"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Percent,
  FileText,
  Bell,
  Save,
  Loader2,
  Store,
  Mail,
  Phone,
  DollarSign,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const TABS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "sales", label: "Sales & Tax", icon: Percent },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function AdminSettings({ session }) {
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    businessName: "",
    businessAddress: "",
    contactEmail: "",
    contactPhone: "",
    currency: "BDT",
    invoicePrefix: "INV-",
    taxRate: 0,
    defaultCommissionRate: 0,
    enableNotifications: true,
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (result.success) {
        setSettings({
          businessName: result.data.businessName || "",
          businessAddress: result.data.businessAddress || "",
          contactEmail: result.data.contactEmail || "",
          contactPhone: result.data.contactPhone || "",
          currency: result.data.currency || "BDT",
          invoicePrefix: result.data.invoicePrefix || "INV-",
          taxRate: result.data.taxRate || 0,
          defaultCommissionRate: result.data.defaultCommissionRate || 0,
          enableNotifications: result.data.enableNotifications ?? true,
        });
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business preferences and system configuration
          </p>
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
              Save Changes
            </>
          )}
        </Button>
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
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          {/* Business Settings */}
          {activeTab === "business" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Basic details about your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={settings.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                      placeholder="Khalil Computer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      placeholder="BDT"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Address</Label>
                  <Input
                    id="businessAddress"
                    value={settings.businessAddress}
                    onChange={(e) => handleChange("businessAddress", e.target.value)}
                    placeholder="Dhaka, Bangladesh"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleChange("contactEmail", e.target.value)}
                        placeholder="contact@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        value={settings.contactPhone}
                        onChange={(e) => handleChange("contactPhone", e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales & Tax Settings */}
          {activeTab === "sales" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sales & Tax Settings
                </CardTitle>
                <CardDescription>
                  Configure invoice and tax preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invoicePrefix"
                        value={settings.invoicePrefix}
                        onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                        placeholder="INV-"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prefix for generating invoice numbers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.taxRate}
                        onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="commissionRate">Default Commission Rate (%)</Label>
                      <p className="text-xs text-muted-foreground">
                        Standard commission percentage for employees
                      </p>
                    </div>
                    <div className="relative w-24">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.defaultCommissionRate}
                        onChange={(e) => handleChange("defaultCommissionRate", parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how you receive alerts and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableNotifications">Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive alerts for sales, low stock, and system updates
                    </p>
                  </div>
                  <Switch
                    id="enableNotifications"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => handleChange("enableNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
