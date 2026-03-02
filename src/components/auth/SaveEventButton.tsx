"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SaveEventButtonProps {
  eventId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function SaveEventButton({
  eventId,
  variant = "ghost",
  size = "default",
  showLabel = true,
}: SaveEventButtonProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      checkIfSaved();
    }
  }, [session, eventId]);

  const checkIfSaved = async () => {
    try {
      const response = await fetch("/api/saved-events");
      if (response.ok) {
        const savedEvents = await response.json();
        setIsSaved(savedEvents.some((se: any) => se.event.id === eventId));
      }
    } catch (error) {
      console.error("Failed to check saved status:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!session) {
      // Prompt to sign in
      toast({
        title: "Sign in required",
        description: "Create an account to save events and sync across devices",
        action: (
          <Button
            size="sm"
            onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
          >
            Sign In
          </Button>
        ),
      });
      return;
    }

    setLoading(true);
    try {
      if (isSaved) {
        // Remove from saved
        const response = await fetch("/api/saved-events", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });

        if (response.ok) {
          setIsSaved(false);
          toast({
            title: "Removed from saved",
            description: "Event has been removed from your saved list",
          });
        }
      } else {
        // Add to saved
        const response = await fetch("/api/saved-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });

        if (response.ok) {
          setIsSaved(true);
          toast({
            title: "Event saved!",
            description: "You can find this event in your saved list",
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleSave}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showLabel && size !== "icon" && (
        <span>{isSaved ? "Saved" : "Save"}</span>
      )}
    </Button>
  );
}
