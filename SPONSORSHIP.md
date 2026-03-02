# 💰 FLA-events Sponsorship System

## Overview

The sponsorship system provides a secondary revenue stream for FLA-events by allowing local businesses (restaurants, bars, venues) to sponsor event listings for increased visibility.

## Features

### ✅ Database Schema
- **Sponsor** model with tier-based limits
- **SponsoredEvent** relationship linking sponsors to events
- **SponsorAnalytic** for tracking impressions, clicks, and conversions
- Tier limits: Bronze (5 events), Silver (15 events), Gold (unlimited)

### ✅ Admin Dashboard
- Password-protected admin interface at `/admin/sponsors`
- Create/edit/delete sponsors
- Assign sponsors to events
- View real-time analytics per sponsor
- Track impressions, clicks, CTR, and conversions

### ✅ Frontend Integration
- Sponsored badge on event cards
- Click tracking for sponsor attribution
- Impression tracking on display
- Automatic sponsor logo display
- Click-through to sponsor website

### ✅ API Endpoints

#### Sponsor Management
- `POST /api/admin/sponsors` - Create new sponsor
- `GET /api/admin/sponsors` - List all sponsors
- `GET /api/admin/sponsors/[id]` - Get sponsor details
- `PUT /api/admin/sponsors/[id]` - Update sponsor
- `DELETE /api/admin/sponsors/[id]` - Delete sponsor

#### Event Assignment
- `POST /api/admin/sponsors/[id]/events` - Assign sponsor to event
- `DELETE /api/admin/sponsors/[id]/events?eventId=...` - Remove from event

#### Analytics
- `GET /api/analytics/sponsors/[id]?days=30` - Get sponsor analytics
- `POST /api/analytics/track` - Track impression/click/conversion

## Pricing Tiers

### 🥉 Bronze - $50/month
- Up to 5 sponsored events
- Basic analytics (impressions, clicks)
- Sponsored badge on listings
- Click tracking

### 🥈 Silver - $150/month
- Up to 15 sponsored events
- Priority placement in search results
- Detailed analytics dashboard
- Logo display on event cards

### 🥇 Gold - $500/month
- Unlimited sponsored events
- Top placement priority
- Full analytics suite
- Custom branding options
- Dedicated support

## Setup & Deployment

### 1. Database Migration
```bash
# Generate Prisma client with new models
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create migration (for production)
npm run db:migrate
```

### 2. Seed Test Data
```bash
npm run seed:sponsors
```

This creates:
- 3 test sponsors (one per tier)
- 10 sponsored event assignments
- Sample analytics data

### 3. Access Admin Dashboard
```
URL: http://localhost:3000/admin/sponsors
Password: fldev2026 (or your DEV_PASSWORD from .env.local)
```

## Usage

### For Administrators

1. **Create a Sponsor**
   - Go to `/admin/sponsors`
   - Click "New Sponsor"
   - Fill in sponsor details
   - Select tier (Bronze/Silver/Gold)
   - Save

2. **Assign Events**
   - Select a sponsor from the list
   - Click "Assign Event"
   - Choose event from the list
   - Event will now show sponsored badge

3. **View Analytics**
   - Click on any sponsor
   - See real-time stats:
     - Total impressions
     - Click-through rate (CTR)
     - Per-event performance
     - 7-day trend chart

### For Developers

#### Track Custom Events
```typescript
// Track impression
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-123',
    metric: 'impression'
  })
})

// Track click
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-123',
    metric: 'click'
  })
})

// Track conversion
await fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'event-123',
    metric: 'conversion'
  })
})
```

#### Display Sponsored Badge
```tsx
import SponsoredBadge from '@/components/SponsoredBadge'

// Compact variant (for cards)
<SponsoredBadge
  sponsor={event.sponsoredEvents[0].sponsor}
  eventId={event.id}
  variant="compact"
/>

// Full variant (for detail pages)
<SponsoredBadge
  sponsor={sponsor}
  eventId={event.id}
  variant="full"
/>
```

## Technical Details

### Database Models

**Sponsor**
- `id` - Unique identifier
- `name` - Business name
- `email` - Contact email (unique)
- `tier` - BRONZE | SILVER | GOLD
- `logoUrl` - Optional logo image
- `website` - Optional sponsor website
- `monthlyBudget` - Tier pricing
- `isActive` - Active/inactive status

**SponsoredEvent**
- `sponsorId` - Reference to sponsor
- `eventId` - Reference to event
- `placementType` - "featured" | "top" | "promoted"
- `priority` - Higher = better placement (0-10)
- `impressions` - Auto-incremented counter
- `clicks` - Auto-incremented counter
- `isActive` - Active/inactive status

**SponsorAnalytic**
- `sponsorId` - Reference to sponsor
- `eventId` - Optional event reference
- `metric` - "impression" | "click" | "conversion"
- `createdAt` - Timestamp for trend analysis

### Auth Pattern
Uses existing `DEV_PASSWORD` environment variable for admin authentication:

```typescript
function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') 
    === process.env.DEV_PASSWORD
}
```

### Frontend Integration
- Events API automatically includes `sponsoredEvents` data
- Sponsored badge auto-tracks impressions on mount
- Click handler tracks clicks and opens sponsor website
- Gracefully handles missing sponsor data

## Testing Checklist

✅ Create sponsors (all 3 tiers)  
✅ Assign events to sponsors  
✅ Verify sponsored badge displays  
✅ Check tier limits enforced  
✅ Test click tracking  
✅ View analytics dashboard  
✅ Test impression tracking  
✅ Delete sponsor (cascade works)  
✅ Update sponsor details  
✅ Remove event assignment  

## Future Enhancements

- [ ] Stripe integration for billing
- [ ] Email notifications for sponsor performance
- [ ] A/B testing for placement strategies
- [ ] Sponsor-specific landing pages
- [ ] Bulk event assignment
- [ ] Geographic targeting options
- [ ] Scheduled campaigns (start/end dates)
- [ ] ROI calculator for sponsors

## Revenue Projections

**Conservative (Year 1)**
- 10 Bronze sponsors × $50 = $500/mo
- 5 Silver sponsors × $150 = $750/mo
- 2 Gold sponsors × $500 = $1,000/mo
- **Total: $2,250/month = $27,000/year**

**Growth Target (Year 2)**
- 25 Bronze sponsors × $50 = $1,250/mo
- 15 Silver sponsors × $150 = $2,250/mo
- 5 Gold sponsors × $500 = $2,500/mo
- **Total: $6,000/month = $72,000/year**

## Support

For issues or feature requests, contact the development team.

---

**Built with:** Next.js, Prisma, PostgreSQL, Tailwind CSS  
**Version:** 1.0.0  
**Last Updated:** 2026-03-02
