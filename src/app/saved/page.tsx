"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Calendar, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SavedEvent {
  id: string;
  event: {
    id: string;
    title: string;
    description: string;
    venue: string;
    address: string;
    startDate: string;
    imageUrl?: string;
    slug: string;
  };
  createdAt: string;
}

export default function SavedEventsPage() {
  const { data: session, status } = useSession();
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSavedEvents();
    }
  }, [session]);

  const fetchSavedEvents = async () => {
    try {
      const response = await fetch("/api/saved-events");
      if (response.ok) {
        const data = await response.json();
        setSavedEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch saved events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (eventId: string) => {
    try {
      const response = await fetch(`/api/saved-events`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        setSavedEvents((prev) => prev.filter((se) => se.event.id !== eventId));
      }
    } catch (error) {
      console.error("Failed to remove saved event:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Saved Events</h1>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {savedEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved events yet</h2>
              <p className="text-gray-600 mb-6">
                Start exploring and save events you're interested in!
              </p>
              <Link href="/">
                <Button>Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedEvents.map((saved) => (
              <Card key={saved.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {saved.event.imageUrl && (
                      <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={saved.event.imageUrl}
                          alt={saved.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {saved.event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(saved.event.startDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{saved.event.venue}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/events/${saved.event.slug}`}>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSaved(saved.event.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
