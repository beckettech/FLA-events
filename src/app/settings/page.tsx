"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    eventReminders: true,
    weeklyDigest: false,
    nearbyEvents: true,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    // TODO: Implement preferences API
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive updates about events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive emails about saved events
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, emailNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event-reminders">Event Reminders</Label>
                <p className="text-sm text-gray-500">
                  Get reminded before your saved events
                </p>
              </div>
              <Switch
                id="event-reminders"
                checked={preferences.eventReminders}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, eventReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-gray-500">
                  Weekly summary of upcoming events
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={preferences.weeklyDigest}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, weeklyDigest: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="nearby-events">Nearby Events</Label>
                <p className="text-sm text-gray-500">
                  Get notified about events near you
                </p>
              </div>
              <Switch
                id="nearby-events"
                checked={preferences.nearbyEvents}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, nearbyEvents: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Your data is stored securely and never shared with third parties.
              </p>
              <Button variant="outline" size="sm">
                Download My Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
