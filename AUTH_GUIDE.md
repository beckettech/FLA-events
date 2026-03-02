# FLA Events - Authentication System Guide

## Overview

FLA-events now has a complete user authentication system using NextAuth.js v4 with email magic links (passwordless authentication).

## Features

✅ **Email Magic Links** - Passwordless sign-in via email  
✅ **Protected Routes** - `/profile`, `/saved`, `/settings` require authentication  
✅ **Session Management** - JWT-based sessions with 30-day expiry  
✅ **User Profiles** - View and manage user information  
✅ **Saved Events** - Bookmark events, sync across devices  
✅ **Guest Mode** - App works without authentication (graceful fallback)  
✅ **Database Integration** - Prisma with SQLite (dev) / Postgres (prod)

---

## Quick Start

### 1. Environment Setup

Add to `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=fla-events-super-secret-key-change-in-production-2026
AUTH_TRUST_HOST=true

# Email Configuration (Optional for development)
EMAIL_SERVER_HOST=smtp.zoho.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=your-email@domain.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@flaevents.com
```

**Note:** Without email credentials, magic links will be logged to console in development.

### 2. Database

The database schema has been updated with these models:
- `User` - User accounts
- `Account` - OAuth accounts (future)
- `Session` - User sessions
- `VerificationToken` - Email verification tokens
- `SavedEvent` - User bookmarked events

Already migrated! ✅

### 3. Start the App

```bash
npm run dev
```

---

## User Flow

### Sign In

1. User visits `/auth/signin`
2. Enters email address
3. Receives magic link via email
4. Clicks link to authenticate
5. Redirected to app (authenticated)

### Guest Users

- App works fully without authentication
- Can browse events, use swipe feature
- **Limitations:** 
  - Cannot save events persistently
  - No cross-device sync
  - No profile/preferences

### Authenticated Users

- All guest features +
- Save events to database
- Sync saved events across devices
- Access to `/profile`, `/saved`, `/settings`
- Future: notifications, recommendations, etc.

---

## Components

### `<UserMenu />`

Drop-down menu for authenticated users.

**Usage:**
```tsx
import { UserMenu } from "@/components/auth/UserMenu";

<UserMenu />
```

Shows:
- Sign In button (if not authenticated)
- User avatar + dropdown menu (if authenticated)
  - Profile
  - Saved Events
  - Settings
  - Sign Out

### `<SaveEventButton />`

Button to save/unsave events.

**Usage:**
```tsx
import { SaveEventButton } from "@/components/auth/SaveEventButton";

<SaveEventButton 
  eventId={event.id}
  variant="outline"
  size="sm"
  showLabel={true}
/>
```

**Props:**
- `eventId` (required) - Event ID to save
- `variant` - Button style: "default" | "ghost" | "outline"
- `size` - Button size: "default" | "sm" | "lg" | "icon"
- `showLabel` - Show "Save"/"Saved" text (default: true)

**Behavior:**
- Not authenticated → Shows toast prompting to sign in
- Authenticated → Saves/unsaves event, shows toast feedback

---

## API Routes

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Saved Events
- `GET /api/saved-events` - Fetch user's saved events
- `POST /api/saved-events` - Save an event
  ```json
  { "eventId": "event-id" }
  ```
- `DELETE /api/saved-events` - Remove saved event
  ```json
  { "eventId": "event-id" }
  ```

---

## Protected Pages

### `/profile`
User profile page with:
- Avatar (initials)
- Email address
- Member since date
- Quick links to Saved Events and Settings
- Sign Out button

### `/saved`
User's saved/bookmarked events:
- List of all saved events
- View details, remove from saved
- Empty state if no saved events

### `/settings`
User preferences:
- Email notifications toggle
- Event reminders toggle
- Weekly digest toggle
- Nearby events toggle
- Privacy settings

### Middleware Protection
Routes are protected by `src/middleware.ts`:
```ts
export const config = {
  matcher: [
    "/profile/:path*",
    "/saved/:path*",
    "/settings/:path*",
  ],
};
```

Not authenticated? Redirected to `/auth/signin` with callback URL.

---

## Checking Authentication

### Client Components

```tsx
"use client";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    return <div>Welcome {session.user.email}!</div>;
  }

  return <div>Not signed in</div>;
}
```

### Server Components / API Routes

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
  const userId = session.user.id;
  // ...
}
```

---

## Migration from Guest Users

### Current Guest Users
- Guest users have `userId` defaulting to "guest" or random ID
- `UserInteraction` model tracks swipes with userId

### Converting to Real Accounts
When a guest signs in:
1. Create account with email
2. **Optional:** Migrate guest data (future enhancement)
3. Link saved events to new user account

**Future Enhancement:** Allow users to claim guest data by matching device/session.

---

## Email Configuration (Production)

### Using Zoho SMTP

1. Get Zoho account (free tier available)
2. Generate app-specific password:
   - Zoho Settings → Security → App Passwords
3. Add to production environment:

```env
EMAIL_SERVER_HOST=smtp.zoho.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=noreply@yourdomain.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=FLA Events <noreply@yourdomain.com>
```

### Alternative: Resend

Install: `npm install resend`

Update `src/lib/auth.ts`:
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend provider instead of EmailProvider
```

---

## Security

### Environment Variables
- `NEXTAUTH_SECRET` - **CHANGE IN PRODUCTION!** Generate:
  ```bash
  openssl rand -base64 32
  ```
- Store secrets in `.env` (never commit!)

### Session
- JWT-based (no database sessions for performance)
- 30-day expiry
- Secure HTTP-only cookies
- CSRF protection built-in

### Database
- User emails are unique
- Passwords not stored (magic links only)
- Prepared statements prevent SQL injection

---

## Testing

### Manual Testing

1. **Sign In Flow:**
   ```
   1. Visit http://localhost:3000/auth/signin
   2. Enter email
   3. Check console for magic link (if email not configured)
   4. Copy magic link URL
   5. Visit URL in browser
   6. Should redirect to homepage (authenticated)
   ```

2. **Protected Routes:**
   ```
   - Visit /profile → should redirect to sign in if not authenticated
   - Sign in → visit /profile → should show profile page
   ```

3. **Save Events:**
   ```
   - Browse events as guest
   - Click "Save" → should show "Sign in required" toast
   - Sign in
   - Click "Save" → should save event
   - Visit /saved → should show saved event
   ```

4. **Sign Out:**
   ```
   - Click user avatar → Sign Out
   - Should return to homepage
   - Visit /profile → should redirect to sign in
   ```

### Automated Testing (Future)

Add tests with Vitest/Playwright:
- Sign-in flow
- Protected route access
- Save/remove events
- Session persistence
- Sign out

---

## Troubleshooting

### "Unauthorized" on API calls
- Check if session exists: `const session = await getServerSession(authOptions)`
- Verify `NEXTAUTH_SECRET` is set
- Check middleware matcher paths

### Magic link doesn't work
- Check email server configuration
- Look for console logs in development
- Verify `NEXTAUTH_URL` matches your domain

### Protected routes not redirecting
- Verify `src/middleware.ts` exists
- Check matcher patterns
- Restart dev server after middleware changes

### Session not persisting
- Check browser cookies are enabled
- Verify `NEXTAUTH_URL` matches exactly (including port)
- Check for cookie domain issues (localhost vs 127.0.0.1)

---

## Roadmap

### Future Enhancements

- [ ] **OAuth Providers** - Google, Apple sign-in
- [ ] **User Preferences** - Store in database (currently UI-only)
- [ ] **Email Notifications** - Event reminders, weekly digest
- [ ] **Guest Data Migration** - Transfer guest interactions to account
- [ ] **Profile Editing** - Update name, preferences
- [ ] **Admin Dashboard** - User management
- [ ] **Analytics** - Track sign-ups, engagement
- [ ] **Rate Limiting** - Prevent abuse on magic link endpoint

---

## Files Changed/Added

### New Files
```
src/lib/auth.ts                          - NextAuth configuration
src/types/next-auth.d.ts                 - TypeScript definitions
src/app/api/auth/[...nextauth]/route.ts  - Auth API handler
src/app/api/saved-events/route.ts        - Saved events API
src/app/auth/signin/page.tsx             - Sign-in page
src/app/auth/verify-request/page.tsx     - Email sent confirmation
src/app/auth/error/page.tsx              - Auth error page
src/app/profile/page.tsx                 - User profile page
src/app/saved/page.tsx                   - Saved events page
src/app/settings/page.tsx                - User settings page
src/components/auth/UserMenu.tsx         - User menu component
src/components/auth/SaveEventButton.tsx  - Save event button
src/components/providers/session-provider.tsx - Session wrapper
src/middleware.ts                        - Route protection
AUTH_GUIDE.md                            - This file
```

### Modified Files
```
prisma/schema.prisma       - Added User, Session, SavedEvent models
.env.local                 - Added NextAuth config
src/app/layout.tsx         - Added SessionProvider
package.json               - Added @next-auth/prisma-adapter
```

---

## Support

Need help? Check:
1. This guide
2. [NextAuth.js Docs](https://next-auth.js.org/)
3. [Prisma Docs](https://www.prisma.io/docs)
4. Console logs in development

---

**Built with ❤️ for FLA Events**
