# MARK. Trading Journal — Enhanced Features Summary

## Files Created/Modified

### New Files
- `calendar.html` — Economic calendar with embeds from ForexFactory, TradingEconomics, Investing.com
- `digest.html` — Weekly email digest preview + subscription form
- `public.html` — Public read-only view of your stats (shareable link)

### Modified Files
- `css/style.css` — Added light/dark theme, market clock, discipline score, tags, heatmap, animations
- `js/db.js` — Added theme, sessions, tags, discipline, memory, correlation, TradingView parser, share cards
- `js/nav.js` — Added theme toggle, market clock, keyboard shortcuts, new nav items
- `js/dashboard.js` — Added tags, discipline, memory, correlation, share cards, TradingView import
- `index.html` — Added mount points for new features, html2canvas CDN

## Features Implemented

### ✅ Client-Side (Works on GitHub Pages)

1. **Dark/Light Theme Toggle**
   - CSS variables switch between themes
   - Persisted in settings (localStorage)
   - Toggle button in sidebar footer

2. **Market Session Clock**
   - Shows live time + date
   - Asia (00:00-09:00 UTC), London (08:00-17:00 UTC), New York (14:30-21:00 UTC)
   - Color-coded dots: green=open, yellow=pre-open, gray=closed
   - Auto-updates every 30 seconds

3. **Tag-Based Filtering**
   - Add tags to trades (#FOMO, #revenge, #perfect, #news)
   - Tag pills appear in trade table
   - Click tags to filter trades
   - Autocomplete from existing tags

4. **Discipline Score**
   - 5-item checklist per trade (plan adherence, no revenge trading, risk management, emotional neutrality, edge patience)
   - Separate from setup grade — tracks execution quality
   - Overall score card on dashboard

5. **Trade Replay / Memory**
   - Surfaces trades from 7/30/90/365 days ago
   - Also shows same-date trades from previous years
   - Appears as a card on the dashboard

6. **Shareable Trade Cards**
   - Generate shareable image of any trade
   - Uses html2canvas library (CDN)
   - Copy as text or download as PNG
   - Branded with MARK. logo

7. **Correlation Heatmap**
   - Shows P&L correlation between symbols
   - Color-coded: green=positive, red=negative
   - Helps identify over-concentration

8. **Typing Animation on Empty States**
   - CSS typing animation for "No trades yet" message
   - Blinking cursor effect

9. **Import from TradingView Alert**
   - Paste webhook alert message in trade modal
   - Parses JSON and key=value formats
   - Auto-fills symbol, direction, entry, stop, take

10. **Keyboard Shortcuts**
    - `N` = Add new trade
    - `/` = Focus search
    - `1-4` = Navigate pages (Journal, Strategies, Prop Firms, Analytics)
    - `Esc` = Close modal

11. **Public Read-Only View**
    - `public.html` shows equity curve + key stats
    - No login required, no sensitive data
    - Share URL with anyone

12. **Economic Calendar**
    - `calendar.html` embeds ForexFactory/TradingEconomics/Investing.com
    - Tab switcher between sources

### ⚠️ Needs External Service (Still Simple)

13. **Weekly Email Digest**
    - `digest.html` shows preview + subscription form
    - Uses Formspark (250 free submissions, no monthly cap) or similar
    - You need to:
      a. Sign up at formspark.io (free, no card)
      b. Create a form, get your form ID
      c. Replace `YOUR_FORMSPARK_ID` in digest.html
      d. Set up redirect URL
    - Alternative: Use splitforms (1,000/month free), JitForms (1,000/month free), or FormSubmit (completely free)

## Setup Instructions

### For GitHub Pages (Static Hosting)

1. Upload all files to your repo
2. Keep folder structure:
   ```
   index.html
   strategies.html
   propfirms.html
   analytics.html
   calendar.html
   digest.html
   public.html
   css/style.css
   js/db.js
   js/nav.js
   js/dashboard.js
   js/strategies.js
   js/propfirms.js
   js/analytics.js
   ```
3. Enable GitHub Pages in Settings → Pages
4. Visit your site

### For Email Digest (Optional)

If you want the weekly email digest:

**Option A: Formspark (Recommended)**
- Free tier: 250 submissions, no monthly cap
- Sign up: https://formspark.io
- Create form → get ID → replace in digest.html
- No credit card required

**Option B: splitforms**
- Free tier: 1,000/month
- Sign up: https://splitforms.com
- More developer-friendly

**Option C: FormSubmit (Zero setup)**
- Completely free, no signup
- Use: `action="https://formsubmit.co/your@email.com"`
- But: exposes your email in HTML

### For TradingView Webhook Import

This is client-side parsing only — you paste the alert text into the trade modal.

For full automation ( TradingView → auto-log trade), you'd need:
- A serverless function (Vercel/Netlify/Cloudflare Workers free tier)
- Or a service like Webhook Relay
- This is beyond pure GitHub Pages but still simple

## Data Privacy

- All trade data stays in your browser's localStorage
- Email digest only sends stats summary (not individual trades)
- Public view only shows aggregated stats
- No data goes to GitHub servers

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- localStorage required
- html2canvas for image generation (falls back to text copy if unavailable)
