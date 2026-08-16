# GitWicket

Your GitHub, rated as a cricket player card. Real commits become strike rate, real pull
requests become wickets, real stars become boundaries.

## How it works

- `/[username]` — an indexable profile page (the SEO engine — every rated profile is its own page)
- `/api/card/[username]` — a live PNG badge, rendered on every request with `@vercel/og`, meant to
  be embedded in READMEs (this is the growth engine — every embed is a live impression and a backlink)
- `lib/github.ts` — pulls six signals from the GitHub GraphQL API
- `lib/cricketStats.ts` — maps those signals to cricket stats
- `lib/getCard.ts` — wraps the above with a 6-hour Redis cache

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in GITHUB_TOKEN at minimum — Redis is optional locally
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it at https://vercel.com/new — it auto-detects Next.js, no config needed
3. Add environment variables in the Vercel project settings:
   - `GITHUB_TOKEN` — a personal access token, no scopes required for public reads
   - `REDIS_URL` — add the free Redis database from the Vercel Storage tab (Vercel's
     default Redis marketplace option is Redis Cloud, a standard TCP connection —
     not Upstash's REST API, so there's no separate token to configure). Grab the
     `redis://default:PASSWORD@HOST:PORT` connection string from the database's
     Connect panel and set it as `REDIS_URL` exactly
4. Deploy. Every push to `main` auto-deploys.
5. Once you have a real domain, update `SITE_URL` in `app/layout.tsx` and the hardcoded URLs
   in `app/page.tsx` and `app/[username]/page.tsx`.

## Before launch

- [ ] Swap `gitwicket.dev` placeholders for your real domain in `layout.tsx`, `page.tsx`,
      `[username]/page.tsx`, `robots.ts`, `sitemap.ts`
- [ ] Submit the domain to Google Search Console once live
- [ ] Rate your own profile and a few well-known devs first, share those cards to seed interest
- [ ] Post to Show HN, Product Hunt, r/cricket, r/programming, r/developersIndia
- [ ] Once you have real usage, wire `app/sitemap.ts` up to Redis so every rated profile gets
      indexed individually — that's what actually compounds SEO traffic over time
