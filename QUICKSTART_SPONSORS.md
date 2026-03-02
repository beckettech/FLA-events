# 🚀 Sponsorship System Quick Start

## 1-Minute Setup

### Step 1: Apply Database Changes
```bash
cd /home/beck/.openclaw/workspace/FLA-events

# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Step 2: Seed Test Data
```bash
npm run seed:sponsors
```

This creates 3 test sponsors:
- 🥉 **Bronze:** Local Coffee Shop ($50/mo, 5 events max)
- 🥈 **Silver:** Miami Beach Hotel ($150/mo, 15 events max)
- 🥇 **Gold:** Florida Tourism Board ($500/mo, unlimited)

### Step 3: Access Admin Dashboard
```bash
# Start dev server
npm run dev

# Open browser to:
http://localhost:3000/admin/sponsors

# Login with:
Password: fldev2026
```

---

## Usage

### Create a Sponsor
1. Click **"+ New Sponsor"**
2. Fill in details (name, email, tier)
3. Select tier (Bronze/Silver/Gold)
4. Click **"Create"**

### Assign to Events
1. Select sponsor from list
2. Click **"Assign Event"**
3. Choose event from modal
4. Event now shows sponsored badge!

### View Analytics
1. Click on any sponsor
2. See real-time stats:
   - Impressions
   - Clicks
   - CTR (Click-through rate)
   - Per-event performance

---

## API Usage

### Track Impression
```javascript
fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-123',
    metric: 'impression'
  })
})
```

### Track Click
```javascript
fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-123',
    metric: 'click'
  })
})
```

---

## Display Sponsored Badge

```tsx
import SponsoredBadge from '@/components/SponsoredBadge'

// If event has sponsor
{event.sponsoredEvents?.[0]?.sponsor && (
  <SponsoredBadge
    sponsor={event.sponsoredEvents[0].sponsor}
    eventId={event.id}
    variant="compact"
  />
)}
```

---

## Troubleshooting

### Database not updating?
The database file is at: `./prisma/db/custom.db`

```bash
# Check tables exist
sqlite3 ./prisma/db/custom.db ".tables"

# Verify sponsors
sqlite3 ./prisma/db/custom.db "SELECT * FROM Sponsor;"
```

### Can't access admin dashboard?
- Check `DEV_PASSWORD` in `.env.local`
- Default password: `fldev2026`

### Sponsored badge not showing?
- Event must have active sponsored event assignment
- Check `sponsoredEvents` field in API response
- Component auto-tracks impressions on mount

---

## Production Deploy

### Switch to PostgreSQL
1. Update `.env`:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

3. Deploy migrations:
```bash
npx prisma migrate deploy
```

---

## Next Steps

- [ ] Populate events database
- [ ] Create real sponsors
- [ ] Assign sponsors to events
- [ ] Test frontend display
- [ ] Monitor analytics
- [ ] Set up billing (Stripe)

---

**Questions?** Check `SPONSORSHIP.md` for full documentation.
