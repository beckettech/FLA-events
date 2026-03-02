"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            A magic link has been sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Mail className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">{email}</p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Click the link in your email to sign in</p>
            <p>• The link expires in 24 hours</p>
            <p>• Check your spam folder if you don't see it</p>
          </div>

          <div className="pt-4 space-y-2">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to home
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="ghost" className="w-full">
                Try different email
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
