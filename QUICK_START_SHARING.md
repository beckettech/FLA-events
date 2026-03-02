# Quick Start: Social Sharing System

## 🚀 How to Use

### For Users

**Share an Event:**
1. Find an event card or visit event detail page
2. Click the Share button (Share2 icon)
3. On mobile: Native share sheet appears
4. On desktop: Modal opens with platform options
5. Choose your platform or copy the link
6. Your referral is tracked automatically!

**Check Your Stats:**
1. Sign in to your account
2. Visit `/admin/analytics/referrals`
3. View your referral stats, shares, and ranking

### For Developers

**Add Share Button Anywhere:**
```tsx
import ShareButton from '@/components/ShareButton'

<ShareButton
  eventId={event.id}
  eventTitle={event.title}
  eventSlug={event.slug}
  eventDescription={event.description}
/>
```

**Icon-Only Variant:**
```tsx
<ShareButton
  eventId={event.id}
  eventTitle={event.title}
  eventSlug={event.slug}
  variant="ghost"
  size="icon"
  iconOnly
/>
```

**Track Referral Manually:**
```typescript
await fetch('/api/referrals/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    referrerId: userId,
    eventId: eventId,
    metadata: { source: 'email' }
  })
})
```

**Get User Stats:**
```typescript
const res = await fetch('/api/referrals/stats')
const data = await res.json()
console.log(data.referrals.total)
```

## 📱 Testing

**Local Development:**
```bash
npm run dev
# Visit http://localhost:3000
# Click any event → Share button
```

**Check Database:**
```bash
npx prisma studio
# View Referral and ShareEvent tables
```

**View Analytics:**
```
http://localhost:3000/admin/analytics/referrals
```

## 🎯 Key Features

✅ 6+ share platforms (Twitter, Facebook, LinkedIn, WhatsApp, SMS, Email)
✅ Native mobile share API
✅ Copy link with instant feedback
✅ Automatic referral tracking
✅ Conversion tracking
✅ Analytics dashboard
✅ Open Graph tags for social previews

## 📊 Success Metrics

**Track These:**
- Total shares (by platform)
- Referral conversion rate
- Viral coefficient (K)
- Top referrers

**Goals:**
- 10%+ of users share events
- 5%+ conversion rate on referrals
- Viral coefficient K > 0.5 (ideally > 1.0)

## 🐛 Troubleshooting

**Share modal doesn't open:**
- Check console for errors
- Verify ShareModal is imported

**Referral not tracked:**
- Check URL has `?ref=userId`
- Verify user is logged in when sharing
- Check API route logs

**Native share not working:**
- Test on real mobile device
- Must be HTTPS or localhost
- Check Web Share API support

**Copy button not working:**
- Requires HTTPS or localhost
- Check browser clipboard permissions

## 📚 Documentation

Detailed docs available:
- `SOCIAL_SHARING_SYSTEM.md` - Complete system guide
- `SOCIAL_SHARING_TESTING.md` - Testing guide
- `TASK7_SOCIAL_SHARING_COMPLETE.md` - Implementation report

## 🔗 Important URLs

**Local:**
- Events: `http://localhost:3000`
- Event detail: `http://localhost:3000/events/[slug]`
- Analytics: `http://localhost:3000/admin/analytics/referrals`
- Prisma Studio: `npx prisma studio`

**Production:**
- Events: `https://fla-events.vercel.app`
- Analytics: `https://fla-events.vercel.app/admin/analytics/referrals`

## ⚡ Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# View database
npx prisma studio

# Run migrations
npx prisma db push
npx prisma generate
```

## 🎉 Quick Wins

**Want viral growth fast?**
1. Add share prompts after saving events
2. Show "X people shared this" on popular events
3. Create referral contests with leaderboard
4. Send weekly stats emails to top referrers
5. Add share incentives (badges, VIP status)

---

**Status:** ✅ Production Ready  
**Build:** Passing  
**Time to implement:** 90 minutes  
**Breaking changes:** None

Happy sharing! 🚀
