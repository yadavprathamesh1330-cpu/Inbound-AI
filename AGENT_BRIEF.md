# Omni AI — shared build conventions

Internal reference for agents implementing pages/features in this repo. Not
user-facing documentation.

## Stack

Next.js 15 (App Router, `src/app`), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui (Base UI primitives, NOT Radix — see "shadcn/ui gotchas" below),
Framer Motion, TanStack React Query, React Hook Form + Zod, Prisma 7 (driver
adapter, not the classic client), Supabase Auth.

Run commands with the local Node install on PATH:
`export PATH="$HOME/.local/node-v24.18.0-darwin-arm64/bin:$PATH"`
(`node`/`npm` are not on the default PATH in this environment.)

A shared dev server is already running on port 3000 against this project's
`.next` directory (other agents/the orchestrator depend on it staying up).
**Do NOT run `npm run dev`, `npm run build`, or `rm -rf .next` yourself** —
concurrent builds corrupt the shared webpack cache and crash the running
server. Verify your work with `npx tsc --noEmit -p .` only. A full
`npm run build` happens once, centrally, after everyone is done.

## Design fidelity

The Stitch design exports in `design-reference/enterprise_dashboard/*/code.html`
are the ground-truth visual reference (colors, spacing, type scale, card
shapes, table layouts). Match them closely — do not invent new visual
patterns. Relevant screens:

- `design-reference/enterprise_dashboard/omni_ai_dashboard/code.html`
- `design-reference/enterprise_dashboard/ai_agents_omni_ai/code.html`
- `design-reference/enterprise_dashboard/call_logs_omni_ai/code.html`
- `design-reference/enterprise_dashboard/leads_omni_ai/code.html`
- `design-reference/enterprise_dashboard/knowledge_base_omni_ai/code.html`
- `design-reference/enterprise_dashboard/integrations_omni_ai/code.html`
- `design-reference/enterprise_dashboard/workflows_omni_ai/code.html`
- `design-reference/enterprise_dashboard/analytics_omni_ai/code.html`
- `design-reference/enterprise_dashboard/team_omni_ai/code.html`
- `design-reference/enterprise_dashboard/google_integrations_omni_ai/code.html`
- `design-reference/voice_platform/omni_ai_landing_page/code.html` (recolor
  to the enterprise black/slate theme — see below, do not use its blue theme)
- `design-reference/voice_platform/omni_ai_create_your_agent/code.html`
- `design-reference/voice_platform/omni_ai_join_the_future/code.html`

The design system's single source of truth is
`src/app/globals.css` (already wired into Tailwind v4 via `@theme inline`).
Use these utility classes directly — they exist already, do not redefine them:

- Colors: `bg-surface`, `bg-surface-container-low/…/-highest`, `text-on-surface`,
  `text-on-surface-variant`, `border-outline-variant`, `bg-primary` (black),
  `text-primary-foreground`, `bg-secondary` (royal blue `#0051d5`, used for
  links/icons/high-intent actions), `bg-destructive`/`text-destructive` (errors),
  emerald-600/emerald-50 utilities for success states (matches design HTML).
- Type scale: `text-display-hero`, `text-display-xl`, `text-display-xl-mobile`,
  `text-headline-lg`, `text-headline-md`, `text-subtitle-lg`, `text-body-lg`,
  `text-body-md`, `text-label-md`, `text-label-sm`, `text-mono-label` (each
  already bundles line-height/letter-spacing/weight — don't add font-bold etc.
  on top unless intentionally overriding).
- Spacing: `gap-gutter` (24px), `px-margin-desktop` (40px), `px-margin-mobile`
  (16px), `p-unit-xs/sm/md/lg/xl/2xl`, `max-w-container-max`.
- Components classes: `.glass-card`, `.glass-nav`, `.voice-pulse`,
  `.glow-border`, `.skeleton-shimmer`, `.custom-scrollbar`, `.mesh-gradient`.

## Reusable components — use these, don't rebuild them

- `@/components/layout/app-shell` — wraps every authenticated `(app)` route
  already via `src/app/(app)/layout.tsx`. Do not add your own sidebar/topbar.
- `@/components/ui-custom/glass-card` (`GlassCard`) — animated glass container.
- `@/components/ui-custom/stat-card` (`StatCard`) — dashboard stat widget
  (label, animated counter, icon, trend).
- `@/components/ui-custom/voice-pulse` (`VoicePulse`) — breathing rings for
  "AI live" indicators.
- `@/components/ui-custom/magnetic-button` (`MagneticButton`) — primary CTA
  button with cursor-follow effect.
- `@/components/ui-custom/animated-counter` (`AnimatedCounter`).
- `@/components/ui-custom/progress-ring` (`ProgressRing`) — circular % gauge.
- `@/components/ui-custom/skeletons` — `StatCardSkeleton`, `TableRowSkeleton`,
  `CardSkeleton`, `AvatarLineSkeleton`. Use these for every loading state
  (React Query `isPending`), never a spinner-only state.
- `@/components/ui-custom/page-header` (`PageHeader`) — title/subtitle/actions
  row used at the top of every app page.
- `@/components/ui-custom/empty-state` (`EmptyState`) — for empty
  lists/tables.
- `@/components/ui-custom/fab` (`Fab`) — floating action button (bottom-right).
- `@/components/ui-custom/page-transition` (`PageTransition`) — wrap page
  content in this for the fade/slide-in transition.
- `@/components/ui-custom/icon` (`Icon`) — `<Icon name="smart_toy" />` renders
  the Lucide icon mapped from the Material Symbols name used in the design
  HTML. Full mapping in `@/lib/icon-map.ts` — if you need an icon not yet
  mapped, add it there (don't import raw `lucide-react` icons ad hoc in page
  files, keep the mapping centralized).
- shadcn/ui primitives already installed: button, card, input, label, select,
  textarea, checkbox, switch, tabs, dialog, dropdown-menu, avatar, badge,
  separator, progress, skeleton, table, sheet, popover, tooltip, slider,
  radio-group, form, calendar, accordion, scroll-area, sonner (toasts via
  `import { toast } from "sonner"`).

## shadcn/ui gotchas (Base UI, not Radix)

This project's shadcn/ui was scaffolded with the `base-nova` preset, which
uses `@base-ui/react` primitives, **not Radix**. Consequences:

- No `asChild` prop. Use `render={<CustomElement />}` instead, e.g.:
  ```tsx
  <DropdownMenuTrigger render={<button className="…" />}>
    {content}
  </DropdownMenuTrigger>
  ```
  See `src/components/layout/topbar.tsx` for a worked example (dropdown +
  sheet trigger + menu items with `render={<Link href="…" />}`).
- `TooltipProvider` takes a `delay` prop, not `delayDuration`.

## Data layer

- `@/lib/prisma` exports a singleton `prisma` client — always import this,
  never construct `new PrismaClient()` yourself (it requires a pg driver
  adapter that's already wired up in that file).
- Schema: `prisma/schema.prisma`. Key models: `Organization`, `User`, `Agent`,
  `PhoneNumber`, `KnowledgeDocument`, `Call`, `Lead`, `Appointment`,
  `Integration`, `AgentIntegration`, `Subscription`, `Invoice`, `ApiKey`,
  `Notification`. Read the schema before writing queries — enums like
  `AgentStatus`, `CallStatus`, `LeadStage`, `IntegrationProvider` etc. are
  defined there.
- `@/lib/auth` exports `getCurrentUser()` (server-only, returns
  `CurrentUser | null` with `orgId`) — use this in Server Components and in
  API routes to scope every Prisma query with `where: { organizationId: user.orgId }`.
  Never query across organizations.
- The database already has realistic seed data (`prisma/seed.ts`, run via
  `npx prisma db seed`) for org "Summit Realty Group" — 4 agents (Clara, Max,
  Luna, Arthur), ~12 calls, ~10 leads, knowledge docs, integrations,
  subscription, notifications. Build pages against this real data via Prisma
  queries — do not hardcode sample arrays in components.
- For data mutated from the client (forms, toggles, kanban drag), create a
  Next.js Route Handler under `src/app/api/**/route.ts` that uses `prisma`
  scoped to `getCurrentUser().orgId`, and call it from the client with
  TanStack React Query (`useQuery`/`useMutation`), invalidating queries on
  success. For read-only Server Components, query Prisma directly in the
  page (no API route needed).
- Types: `@/lib/types` has `CurrentUser`. Add feature-specific shared types
  there if multiple files need them.

## Page structure convention

Every page under `src/app/(app)/**/page.tsx` should:
1. Be an `async` Server Component that calls `getCurrentUser()` and fetches
   initial data via Prisma directly (fast first paint, no loading flash).
2. Render a client "island" component (in the same route folder, suffixed
   `-client.tsx`) for interactive parts (tabs, filters, mutations), hydrated
   with the server-fetched data as `initialData` for React Query where
   relevant.
3. Start with `<PageHeader title="…" subtitle="…" actions={…} />`, wrap body
   content in `<PageTransition>`.
4. Use `EmptyState` when a list/table has zero rows.

## Icons

Use `<Icon name="…" />` with the exact Material Symbols name from the design
HTML (e.g. `smart_toy`, `call`, `bar_chart`, `webhook`). Check
`src/lib/icon-map.ts` first; extend it if a name is missing rather than
inlining a raw Lucide import.

## What NOT to do

- Don't redesign layouts, spacing, or colors — port them from the design
  HTML using the utility classes above.
- Don't add a second sidebar/topbar — `(app)/layout.tsx` already provides it.
- Don't hand-roll a new toast/notification system — use `sonner`.
- Don't invent new Tailwind color/spacing values — everything needed is
  already in `globals.css`; if something is truly missing, add it there
  (not as one-off arbitrary values scattered across pages).
- Don't call external APIs (Twilio/OpenAI/Deepgram/ElevenLabs/Google) inline
  in page components — those live in `src/lib/services/*` (backend task) and
  are called from route handlers/server actions only.

## Before you finish

- `npx tsc --noEmit -p .` must pass with zero errors. Do not run
  `npm run dev`/`npm run build`/`rm -rf .next` (see top of this doc).
- If you added a new page users navigate to, confirm it's reachable from
  the sidebar (`src/components/layout/nav-items.ts`) or from wherever the
  design HTML links it.
- Report back a short list of every file you created/edited.
