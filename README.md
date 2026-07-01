# Inbound AI — Omni AI Voice Agent Platform

An AI voice-agent SaaS that lets businesses deploy inbound AI receptionists to
answer calls, qualify leads, book appointments, answer FAQs, collect customer
information, and sync everything to connected apps like Google Sheets and Google
Calendar.

Think Vapi + Retell AI + ElevenLabs + OpenAI + Stripe dashboard, combined into
one premium business platform.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4,
  shadcn/ui (Base UI), Framer Motion, TanStack React Query, React Hook Form, Zod,
  Lucide icons, Recharts
- **Backend / data:** Prisma 7 + PostgreSQL, Next.js Route Handlers
- **Auth:** Supabase Auth
- **AI & telephony (service layer):** OpenAI, Deepgram (STT), ElevenLabs (TTS),
  Twilio (telephony), Google Sheets & Calendar APIs

## Features

- Marketing landing page, split-screen auth, onboarding + 7-step create-agent
  wizard
- Dashboard with live call analytics, top agents, recent calls, animated stats
- AI Agents (create / duplicate / pause / publish / delete / test)
- Call logs with transcript, AI summary, sentiment, lead score, recording replay
- Leads pipeline kanban (New / Qualified / Appointment / Won / Lost) + CSV export
- Knowledge base (PDF/DOCX/TXT upload, website crawl, FAQs, re-index)
- Integrations (Google Sheets, Google Calendar, Slack, Webhook, HubSpot,
  Salesforce, Zoho)
- Analytics (call trends, peak hours, lead conversion funnel, AI success rate)
- Team, Billing, Settings (business, branding, notifications, security, API keys)
- Post-call pipeline: transcript → AI summary → lead score → field extraction →
  DB persistence, with a Twilio inbound-call webhook

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # fill in credentials (see below)
npm run db:push             # apply the Prisma schema to your database
npm run db:seed             # optional: load demo data
npm run dev                 # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values. The app runs without the
AI/telephony keys — those service integrations activate the moment their keys are
present, and fail with a clear error (rather than fake success) until then.

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## Project structure

```
src/
  app/
    (marketing)/     landing + marketing pages
    (auth)/          login / signup
    onboarding/      welcome wizard
    (app)/           authenticated dashboard, agents, calls, leads, etc.
    api/             route handlers (agents, calls webhook, integrations, ...)
  components/        layout shell, marketing sections, auth, shared UI primitives
  lib/               prisma, supabase, auth, service integrations
prisma/              schema, migrations, seed
design-reference/    original Stitch design exports used as the visual source
```

## License

Private.
