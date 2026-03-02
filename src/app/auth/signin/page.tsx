"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        // Redirect to verification page
        window.location.href = "/auth/verify-request?email=" + encodeURIComponent(email);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to FLA Events</CardTitle>
          <CardDescription>
            Sign in with your email to save events and sync across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>We'll send you a magic link to sign in</p>
            <p className="mt-1">No password required!</p>
          </div>
          <div className="mt-6 pt-6 border-t text-center">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-sm"
            >
              Continue as guest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
