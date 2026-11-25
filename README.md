# Habon website

The marketing site and free habit tools for **[Habon: Habit Tracker & Goals](https://apps.apple.com/us/app/habit-tracker-goals-habon/id6828774437)**, an iPhone, iPad and Apple Watch habit tracker.

- **Live site:** https://habon.pages.dev (Cloudflare Pages)
- **App Store ID:** `6828774437` · Developer: Sajid A Khokhar
- **Stack:** [Astro](https://astro.build) (static output) · Tailwind CSS v4 · TypeScript · jsPDF · localStorage. No backend, database or paid service.

## What is in it

**Free browser tools** (no sign-up; data stays in `localStorage`)

| Tool | Path |
|---|---|
| Online habit tracker (daily/weekly/monthly, calendar, streaks, stats, charts, backup) | `/online-habit-tracker/` |
| Printable habit tracker generator (weekly/monthly, 4 layouts, 8 colors, A4 + US Letter, live PDF preview, print) | `/printable-habit-tracker/` |
| Daily routine planner (drag and drop, print) | `/daily-routine-planner/` |
| Habit streak calculator | `/habit-streak-calculator/` |
| 30-day habit challenge (+ printable sheet) | `/30-day-habit-challenge/` |
| Weekly habit planner · Monthly habit calendar | `/weekly-habit-planner/` · `/monthly-habit-calendar/` |
| Goal planner · Habit ideas generator | `/goal-planner/` · `/habit-ideas-generator/` |
| Morning / evening routine generators | `/morning-routine-generator/` · `/evening-routine-generator/` |
| Habit consistency calculator | `/habit-consistency-calculator/` |

**SEO landing pages:** habit tracker, free habit tracker, habit tracker for iPhone, daily habit tracker, streak tracker, goal tracker, templates, PDF downloads, students, features, FAQ, about, contact, privacy, terms, and a 15-article blog (`src/content/blog`).

**Technical SEO:** unique titles/descriptions, canonical URLs, Open Graph + Twitter cards, `SoftwareApplication`, `Organization`, `WebSite`, `WebApplication`, `BreadcrumbList`, `Article` and `FAQPage` JSON-LD (no ratings or reviews are invented), sitemap, `robots.txt`, RSS, custom 404, Apple Smart App Banner, WebP images via `astro:assets`.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs ./dist
npm run preview
```

Requires Node 20+ (tested on Node 26).

### Configuration

Copy `.env.example` to `.env` (or set variables in Cloudflare Pages → Settings → Environment variables):

| Variable | Purpose |
|---|---|
| `SITE_URL` | Canonical origin used for sitemap, canonicals and JSON-LD (default `https://habon.pages.dev`). Also update the `Sitemap:` line in `public/robots.txt` if you change it. |
| `PUBLIC_CF_BEACON_TOKEN` | Cloudflare Web Analytics token (cookieless). Optional. |
| `PUBLIC_GA_ID` | Google Analytics 4 measurement ID. Optional. When set, a consent banner appears and GA only loads after the visitor accepts. |

Custom events (when GA is enabled and consented): `app_store_click` (with `placement`), `tool_use`, `pdf_download`, `pdf_print`, `habit_created`, `goal_created`, `challenge_selected`, `habit_idea_added`, `routine_sent_to_planner`.

## Deploy (Cloudflare Pages)

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `NODE_VERSION=22` (environment variable) |

## Project layout

```
src/
  components/   AppStoreButton, AppCta, Shot, Faq, Header, Footer, …
  content/blog/ Markdown articles (frontmatter validated in content.config.ts)
  layouts/      BaseLayout (head/SEO/JSON-LD), PageLayout (landing + tool pages)
  lib/          site config, seo (JSON-LD), dates, streak maths, pdf builders, storage
  pages/        one file per route
  scripts/      client-side tool logic (vanilla TS, loaded per page)
  assets/       App Store screenshots and icon (WebP)
public/         icons, App Store badge, robots.txt, _headers, manifest
scripts/        QA tooling (Playwright crawler/tests, Lighthouse runner)
```

## QA scripts

These drive a locally installed Chrome through `playwright-core` (no browser download):

```bash
npm run build && npx astro preview --port 4321 &
node scripts/qa-crawl.mjs     # every sitemap URL: status, console errors, h1, meta, canonical, JSON-LD, alt text, links
node scripts/test-tracker.mjs # online tracker flows
node scripts/test-tools.mjs   # all other tools, PDF generation, persistence, theme toggle
scripts/lh.sh http://localhost:4321 mobile   # Lighthouse (needs CHROME_PATH)
```

## Content and accuracy rules

- Facts about Habon come from its App Store listing. Do not add ratings, reviews, download counts or features that are not there.
- The app currently requires iOS 27.0 or later.
- Research claims in articles are limited to well-documented findings and phrased with their limits.

## Credits

App name, icon and screenshots belong to Habon / Sajid A Khokhar. The App Store badge is Apple's, used per Apple's marketing guidelines. Apple, iPhone, iPad, Apple Watch and App Store are trademarks of Apple Inc.
