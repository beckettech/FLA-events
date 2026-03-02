"use client";

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Calendar, LogOut, Loader2, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session.user.email?.[0].toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to events
            </Button>
          </Link>
          <h1 className="text-xl font-bold">My Profile</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-3xl bg-blue-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">
              {session.user.name || "User"}
            </CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{session.user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/saved">
              <Button variant="outline" className="w-full justify-start">
                <Bookmark className="mr-2 w-4 h-4" />
                My Saved Events
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 w-4 h-4" />
                Preferences
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
