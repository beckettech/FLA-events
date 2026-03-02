# Quick Integration Guide - Adding Auth to Main App

This shows exactly where to add the authentication components to the main FLA Events app.

---

## 1. Add User Menu to Navigation/Header

The main page (`src/app/page.tsx`) currently has a navigation section. Add the `<UserMenu />` component there.

**Location:** Around line 500-600 (look for the header/navigation JSX)

**Example:**
```tsx
import { UserMenu } from "@/components/auth/UserMenu";

// Inside your navigation JSX:
<div className="flex items-center gap-2">
  {/* Existing buttons (map view, settings, etc.) */}
  <Button variant="ghost" size="icon" onClick={() => setView('map')}>
    <Map className="h-5 w-5" />
  </Button>
  
  {/* ADD THIS: */}
  <UserMenu />
</div>
```

---

## 2. Add Save Button to Event Cards

The app uses a `SwipeCard` component for events. Add the save button to each card.

**Option A: In Event Detail Modal**
```tsx
import { SaveEventButton } from "@/components/auth/SaveEventButton";

// In the event detail dialog:
<Dialog open={selectedEvent !== null}>
  <DialogHeader>
    <div className="flex items-center justify-between">
      <DialogTitle>{selectedEvent?.title}</DialogTitle>
      <SaveEventButton 
        eventId={selectedEvent.id}
        variant="ghost"
        size="icon"
      />
    </div>
  </DialogHeader>
  {/* Rest of dialog content */}
</Dialog>
```

**Option B: On SwipeCard Component**
```tsx
import { SaveEventButton } from "@/components/auth/SaveEventButton";

// In SwipeCard.tsx, add to the card actions:
<div className="absolute bottom-4 right-4 flex gap-2">
  <SaveEventButton 
    eventId={event.id}
    variant="outline"
    size="sm"
  />
</div>
```

**Option C: In Event List View**
```tsx
// When displaying events in list/grid view:
{events.map((event) => (
  <Card key={event.id}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{event.title}</CardTitle>
        <SaveEventButton 
          eventId={event.id}
          size="icon"
          showLabel={false}
        />
      </div>
    </CardHeader>
    {/* Rest of card */}
  </Card>
))}
```

---

## 3. Update Navigation to Include Saved Events Link

Add a link to `/saved` in the main navigation.

**Example Bottom Navigation:**
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex justify-around py-2">
    <Link href="/">
      <Button variant="ghost" size="sm">
        <HomeIcon className="h-5 w-5" />
        <span>Home</span>
      </Button>
    </Link>
    
    {/* ADD THIS: */}
    <Link href="/saved">
      <Button variant="ghost" size="sm">
        <Bookmark className="h-5 w-5" />
        <span>Saved</span>
      </Button>
    </Link>
    
    <Link href="/profile">
      <Button variant="ghost" size="sm">
        <User className="h-5 w-5" />
        <span>Profile</span>
      </Button>
    </Link>
  </div>
</div>
```

---

## 4. Update User Interactions to Use Real User ID

Currently, the app might be using a guest userId. Update the interaction tracking:

**In interaction handler:**
```tsx
import { useSession } from "next-auth/react";

function EventInteractionHandler() {
  const { data: session } = useSession();
  
  const handleSwipe = async (eventId: string, action: 'left' | 'right') => {
    const userId = session?.user?.id || 'guest';
    
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        eventId,
        action: `swipe_${action}`,
      }),
    });
  };
  
  // ...
}
```

---

## 5. Show Sign-In Prompt on Guest Actions

When a guest user tries to save an event, prompt them to sign in.

**The `SaveEventButton` already does this!** But you can add similar prompts elsewhere:

```tsx
import { useSession, signIn } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

function SomeComponent() {
  const { data: session } = useSession();
  
  const handleGuestAction = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Create an account to save events and sync across devices",
        action: (
          <Button size="sm" onClick={() => signIn()}>
            Sign In
          </Button>
        ),
      });
      return;
    }
    
    // Proceed with action
  };
}
```

---

## 6. Optional: Add Sign-In Banner for Guests

Show a banner to encourage guests to sign up:

```tsx
import { useSession, signIn } from "next-auth/react";

function GuestBanner() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  
  if (status === "loading" || session || dismissed) return null;
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <p className="font-semibold text-blue-900">
            Sign in to save events & sync across devices
          </p>
          <p className="text-sm text-blue-700">
            Keep your favorite events in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => signIn()}>
            Sign In
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add to layout or main page:
<GuestBanner />
```

---

## 7. Testing Checklist

After integrating:

- [ ] UserMenu appears in header/navigation
- [ ] Clicking UserMenu shows sign-in (when not authenticated)
- [ ] Save button appears on event cards
- [ ] Clicking save as guest shows sign-in prompt
- [ ] Sign in with email works (check console for magic link)
- [ ] After sign-in, can save events
- [ ] Saved events appear in `/saved`
- [ ] Profile page loads
- [ ] Sign out works

---

## Example: Complete Integration in Main Page

Here's a minimal example showing all key integration points:

```tsx
'use client'

import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/UserMenu";
import { SaveEventButton } from "@/components/auth/SaveEventButton";
// ... other imports

export default function HomePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">FLA Events</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            {/* ADD USER MENU */}
            <UserMenu />
          </div>
        </div>
      </header>
      
      {/* Event Cards */}
      <main className="p-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{event.title}</CardTitle>
                {/* ADD SAVE BUTTON */}
                <SaveEventButton 
                  eventId={event.id}
                  size="icon"
                  showLabel={false}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p>{event.description}</p>
            </CardContent>
          </Card>
        ))}
      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <HomeIcon className="h-5 w-5" />
            </Button>
          </Link>
          {/* ADD SAVED LINK */}
          <Link href="/saved">
            <Button variant="ghost" size="sm">
              <Bookmark className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
```

---

## That's It!

The authentication system is now fully integrated. Users can:
- Sign in with email
- Save events
- View saved events
- Access their profile
- Sign out

And guests can still use the app without signing in!

---

**Need Help?** See `AUTH_GUIDE.md` for complete documentation.
