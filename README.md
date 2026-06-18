# MARK. — a self-hosted trading journal

A static, no-build trading journal you run entirely in your own browser and host for free on GitHub Pages. No backend, no signup, no subscription — your data lives in your browser's local storage on your device.

## Features

- **Journal** — log every trade (symbol, direction, entry/stop/take, size, risk, P&L), with a screenshot upload or a link as proof.
- **Strategies** — define a strategy's entry checklist once. When you log a trade against that strategy, you tick off which rules it met and the app scores it automatically (e.g. 90%+ → **A setup**, 75%+ → **B setup**, 60%+ → **C setup**, below that → **D**). The grading scale is yours to edit.
- **Prop Firms** — set up each account's starting size, daily drawdown limit, max drawdown limit (static or trailing), risk per trade, and as many challenge phases as you need with their profit targets. Link trades to an account and the app tracks your live balance, drawdown usage, and phase progress, and flags a breach the moment a limit is crossed.
- **Analytics** — equity curve, win/loss breakdown, win rate by setup grade (so you can see whether your grading actually predicts results), P&L by strategy, by symbol, and by month, all filterable by date, strategy, account, or symbol.

## Hosting it on GitHub Pages

1. Create a new repository on GitHub (public repos get free Pages hosting; private repos need a paid plan for Pages).
2. Upload everything in this folder to the repository — keep the folder structure as-is (`index.html` at the root, alongside the `css/` and `js/` folders).
3. In the repository, go to **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**, pick your default branch (usually `main`) and the `/ (root)` folder, then save.
5. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/` within a minute or two. That's your journal.

You can also drag-and-drop the folder into [GitHub Desktop](https://desktop.github.com/) or use `git add . && git commit -m "trading journal" && git push` if you're comfortable with the command line.

## A note on your data

Everything you enter is stored in your browser's `localStorage`, scoped to the exact URL you open. That means:

- Your data is **private** — it never leaves your device, and there's no server involved.
- It's also **local to one browser**. Opening the site in a different browser, a different computer, or incognito mode starts you with an empty journal.
- Clearing your browser's site data for this page will erase your journal.

Because of this, use the **Export backup (.json)** button in the sidebar regularly — it downloads a complete copy of your trades, strategies, and accounts. **Import backup** can merge a file back in or replace everything currently stored, which is also how you'd move your journal to a new browser or device. There's also a **Reset all data** button if you ever want to start clean.

## Getting started

1. Open **Strategies** and create your first strategy — give it a name and list out the conditions a real setup has to meet. The grading scale (what score counts as an A, B, or C) lives at the top of that page.
2. Open **Prop Firms** (optional) if you're trading a funded account — enter its size, drawdown rules, risk per trade, and phases.
3. Go to **Journal** and add a trade. Pick the strategy you used and tick the checklist; the grade badge updates live as you check things off. Attach a screenshot or a link as proof, and link the trade to a prop firm account if relevant.
4. Check **Analytics** to see how your grades, strategies, and symbols are actually performing.

## Customizing

- Colors, fonts, and spacing are all defined as CSS variables at the top of `css/style.css` — change the values under `:root` to re-theme the whole app.
- Chart visuals are powered by [Chart.js](https://www.chartjs.org/), loaded from a CDN in `analytics.html`.

## File structure

```
index.html         Journal (trade log + add/edit trade)
strategies.html     Strategy builder + grading scale
propfirms.html       Prop firm accounts, drawdown & phase tracking
analytics.html       Charts and filters
css/style.css        Design system / all styling
js/db.js             Data layer: storage, grading, stats, export/import
js/nav.js            Shared sidebar, ticker, modal, toast helpers
js/dashboard.js       Journal page logic
js/strategies.js     Strategies page logic
js/propfirms.js       Prop firms page logic
js/analytics.js       Analytics page logic
```
