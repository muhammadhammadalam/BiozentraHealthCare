import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Bell, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const SETTINGS_KEY = "biozentra-settings";

export interface AppSettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  lowStockAlerts: boolean;
  orderUpdates: boolean;
  paymentReminders: boolean;
}

export const defaultSettings: AppSettings = {
  companyName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Pakistan",
  currency: "PKR",
  lowStockAlerts: true,
  orderUpdates: true,
  paymentReminders: false,
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Riyadh",
  "Jeddah",
  "Doha",
  "Kuwait City",
  "Muscat",
  "Other",
];

const countries = ["Pakistan", "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"];

const currencies = [
  { code: "PKR", label: "PKR - Pakistani Rupee" },
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "QAR", label: "QAR - Qatari Riyal" },
  { code: "KWD", label: "KWD - Kuwaiti Dinar" },
  { code: "OMR", label: "OMR - Omani Rial" },
  { code: "BHD", label: "BHD - Bahraini Dinar" },
];

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleSaveCompany = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast.success("Company settings saved successfully");
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear ALL app data? This includes products, orders, customers, invoices, and suppliers. This cannot be undone."
      )
    ) {
      const keysToRemove = [
        "biozentra-ctx-products",
        "biozentra-ctx-orders",
        "biozentra-ctx-customers",
        "biozentra-ctx-invoices",
        "biozentra-stock",
        "biozentra-suppliers",
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      toast.success("All data cleared. Refresh the page to start fresh.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your application preferences</p>
        </motion.div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Company Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Your business details for invoices and reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="e.g. BIOZENTRA Healthcare"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="info@yourcompany.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+92 3XX XXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={settings.city}
                    onValueChange={(v) => setSettings({ ...settings, city: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={settings.country}
                    onValueChange={(v) => setSettings({ ...settings, country: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveCompany}>Save Changes</Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Regional Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Regional Preferences</CardTitle>
                  <CardDescription>Currency and locale settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(v) => setSettings({ ...settings, currency: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure alert preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, lowStockAlerts: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Notifications for new orders</p>
                </div>
                <Switch
                  checked={settings.orderUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, orderUpdates: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">Alerts for pending payments</p>
                </div>
                <Switch
                  checked={settings.paymentReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, paymentReminders: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Clear All Data</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all products, orders, customers, and invoices
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleClearAllData}>
                  Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
