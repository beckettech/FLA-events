# 🚨 FIX EMPTY DATABASE NOW

## The Problem
Production FLA-events has **0 events** because there was no automated scraper running.

## The Solution (DONE ✅)
I've created a complete automated scraper system:

1. ✅ **Ticketmaster scraper script** (`scripts/scrape-events.ts`)
2. ✅ **Vercel cron job** (runs daily at 6 AM EST)
3. ✅ **Manual trigger API** (`/api/admin/scrape-now`)
4. ✅ **Complete documentation** (SCRAPER_GUIDE.md)

---

## IMMEDIATE ACTION REQUIRED

### Step 1: Commit & Deploy (30 seconds)

```bash
cd /home/beck/.openclaw/workspace/FLA-events

# Commit everything
git add -A
git commit -m "Add automated event scraper - fixes empty database"
git push origin main

# Deploy to Vercel (automatic via GitHub)
# Or manually: vercel --prod
```

### Step 2: Get Production Database URL (10 seconds)

```bash
# Pull environment variables from Vercel
vercel env pull .env.production

# OR get it from Vercel dashboard:
# https://vercel.com/beckettech/fla-events/settings/environment-variables
```

### Step 3: Run Scraper NOW (2 minutes)

```bash
# Use the DATABASE_URL from Vercel
DATABASE_URL="postgresql://neon_user:password@host/db" bun run scripts/scrape-events.ts --limit=200

# This will:
# - Fetch 200 upcoming FL events from Ticketmaster
# - Create categories & regions
# - Populate your production database
# - Take ~2 minutes
```

---

## Automated Solution (After Deploy)

Once deployed, events will refresh **automatically every day at 6 AM EST** via Vercel Cron.

### Verify Cron is Running

1. Go to Vercel Dashboard → FLA-events → Cron Jobs
2. You should see: `/api/cron/scrape-events` scheduled daily
3. Check execution logs after first run

### Manual Trigger (Anytime)

```bash
# Set ADMIN_KEY in Vercel env vars first
curl "https://fla-events.vercel.app/api/admin/scrape-now?key=YOUR_ADMIN_KEY"
```

---

## Prevention Checklist

✅ **Automated scraping:** Vercel cron runs daily  
✅ **Manual trigger:** `/api/admin/scrape-now` available  
✅ **Documentation:** SCRAPER_GUIDE.md has full details  
✅ **Monitoring:** Check Vercel cron logs weekly  

---

## What Changed

### New Files
```
scripts/scrape-events.ts               # CLI scraper
src/app/api/cron/scrape-events/        # Auto endpoint
src/app/api/admin/scrape-now/          # Manual trigger
vercel.json                            # Cron config
SCRAPER_GUIDE.md                       # Documentation
FIX_EMPTY_DATABASE_NOW.md              # This file
```

### Updated Files
```
package.json                           # Added "scrape" scripts
```

---

## Quick Reference

```bash
# Local scraping (SQLite)
bun run scrape

# Production scraping (Neon)
DATABASE_URL="postgresql://..." bun run scrape:prod

# Custom limit
bun run scripts/scrape-events.ts --limit=500

# Check event count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Event\";"
```

---

## Expected Output

```
🎫 Ticketmaster Event Scraper for Florida
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Setting up categories and regions...
   ✅ Database ready

2️⃣  Fetching events from Ticketmaster...

   📦 Found 200 events (page 0)
   💾 Saved 187 events

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 SCRAPING COMPLETE!

   Total events fetched:  200
   Total events saved:    187
   Database:              neon.tech

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Troubleshooting

### "No DATABASE_URL found"
→ Set it: `export DATABASE_URL="postgresql://..."`

### "Ticketmaster API error"
→ Check API key in .env.local or use default demo key

### "Prisma client not generated"
→ Run: `bunprisma generate`

### Still 0 events after scraping?
→ Check database: `psql $DATABASE_URL -c "SELECT * FROM \"Event\" LIMIT 5;"`

---

**RUN THIS NOW TO FIX THE ISSUE:**

```bash
cd FLA-events
git add -A && git commit -m "Add automated scraper" && git push
vercel env pull .env.production
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" bun run scripts/scrape-events.ts --limit=200
```

---

**Last updated:** March 2, 2026  
**Created by:** Clawdbot  
**Urgency:** 🚨 HIGH - Production site has 0 events
