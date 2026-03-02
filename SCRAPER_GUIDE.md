# Event Scraper Guide

## Overview

The FLA-events scraper automatically fetches upcoming events from Ticketmaster and populates the production database. **This runs automatically every day at 6:00 AM EST via Vercel Cron.**

---

## Why This Exists

**Problem:** Production database was empty because no automation existed to keep events fresh.

**Solution:** Automated daily scraping + on-demand manual triggers.

---

## Automatic Scraping (Vercel Cron)

### Schedule
- **When:** Daily at 6:00 AM EST
- **Endpoint:** `/api/cron/scrape-events`
- **Configuration:** `vercel.json`

### What It Does
1. Fetches 200 events from Ticketmaster Florida
2. Creates/updates categories and regions as needed
3. Upserts events (prevents duplicates via slug)
4. Skips past events automatically

### Monitoring
Check Vercel dashboard → Cron Jobs to see execution logs.

---

## Manual Scraping

### Option 1: Command Line (Local/CI)

```bash
# Local (SQLite)
cd FLA-events
bun run scrape

# Production (Neon Postgres)
DATABASE_URL="postgresql://..." bun run scrape:prod

# Custom limit
bun run scripts/scrape-events.ts --limit=500
```

### Option 2: Admin API (Production)

```bash
# Trigger scrape via HTTP
curl "https://fla-events.vercel.app/api/admin/scrape-now?key=YOUR_ADMIN_KEY"
```

Set `ADMIN_KEY` in Vercel environment variables.

---

## Environment Variables

Add these to Vercel:

```bash
# Required
DATABASE_URL="postgresql://neon_connection_string"

# Optional
TICKETMASTER_API_KEY="your_api_key" # Uses free demo key by default
CRON_SECRET="random_secret_key"     # For cron security
ADMIN_KEY="admin_secret"            # For manual triggers
```

---

## How It Works

### 1. Data Flow
```
Ticketmaster API
  ↓
Fetch FL events (200/page)
  ↓
Transform & validate
  ↓
Upsert to Neon Postgres
  ↓
FLA-events.vercel.app
```

### 2. Duplicate Prevention
Events are identified by **slug** (unique):
- Format: `{title-slug}-{YYYYMMDD}-{tm-id}`
- Example: `taylor-swift-concert-20260815-abc123`

### 3. Data Mapping
| Ticketmaster | Database |
|--------------|----------|
| `name` | `title` |
| `dates.start.localDate` | `startDate` |
| `classifications[0].segment.name` | `category` |
| `venues[0].city.name` | `region` |
| `priceRanges[0].min` | `price` |
| `images[0].url` | `imageUrl` |

---

## Troubleshooting

### No events loading?

**Quick fix (manual scrape):**
```bash
cd /home/beck/.openclaw/workspace/FLA-events
DATABASE_URL=$DATABASE_URL bun run scripts/scrape-events.ts --limit=200
```

**Check database:**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Event\";"
```

### Cron not running?

1. Check Vercel dashboard → Cron Jobs
2. Verify `vercel.json` is deployed
3. Check cron logs for errors

### API errors?

- **401:** Check `CRON_SECRET` is set and matches
- **500:** Check Ticketmaster API key and rate limits
- **Database errors:** Verify Neon connection string

---

## Files

```
FLA-events/
├── vercel.json                              # Cron schedule
├── scripts/scrape-events.ts                 # CLI scraper
├── src/app/api/cron/scrape-events/route.ts # Auto endpoint
└── src/app/api/admin/scrape-now/route.ts   # Manual trigger
```

---

## Next Steps

- [ ] Monitor cron execution for first week
- [ ] Add Slack/Discord notifications on scrape completion
- [ ] Implement event deduplication across multiple pages
- [ ] Add analytics: events added, updated, skipped

---

## Emergency: Database Empty Again?

**Immediate fix:**
```bash
# From workspace
cd FLA-events
DATABASE_URL="postgresql://..." bun run scrape:prod
```

**Prevent future issues:**
1. Check Vercel cron logs
2. Verify environment variables are set
3. Test manual trigger endpoint
4. Check Ticketmaster API quota

---

**Last updated:** March 2, 2026  
**Status:** ✅ Automated + tested
