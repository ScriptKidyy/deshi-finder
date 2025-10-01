import { Settings as SettingsIcon, Sun, Scan, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [autoDetectCountry, setAutoDetectCountry] = useState(true);
  const [preferIndian, setPreferIndian] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Customize your VocalKart Scanner experience
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Scan className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Scanner Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="font-medium">Auto-detect Country</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically identify product country from barcode
                  </p>
                </div>
                <Switch checked={autoDetectCountry} onCheckedChange={setAutoDetectCountry} />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="font-medium">Prefer Indian Products</p>
                  <p className="text-sm text-muted-foreground">
                    Show Indian products first in search results
                  </p>
                </div>
                <Switch checked={preferIndian} onCheckedChange={setPreferIndian} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new Indian alternatives
                  </p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Privacy & Data</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="font-medium">Clear App Data</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all stored search history and preferences
                  </p>
                </div>
                <Button variant="destructive">Clear Data</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
