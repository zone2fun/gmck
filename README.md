# GMCK

Mobile-first PWA foundation for an 18+ gay and bisexual men's community in Thailand.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS 4
- Supabase Auth / PostgreSQL / Realtime (project: gmck, Tokyo)
- PWA manifest foundation

## Local development

1. Install Node.js 22 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Add the Supabase Project URL and publishable key from the Supabase Dashboard.
5. Start: `npm run dev`

## Security notes

- Never commit `.env.local`, Supabase secret keys, or service-role keys.
- The browser may only receive the Supabase publishable key.
- Do not add real member data until database RLS policies and authorization tests are reviewed.
- Age assurance, location privacy, moderation, reporting, and rate limits are required before public launch.

## Current milestone

Phase 0: app shell, responsive dark theme, PWA manifest, and Supabase client factories.
Authentication and database features are intentionally not enabled yet.
