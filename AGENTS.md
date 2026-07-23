# AGENTS.md

## Project Overview

Indonesian e-commerce PWA (spray paint & motorcycle parts). Astro 5 SSR + React 19 + Tailwind CSS 3 + TypeScript. Backend: Supabase (auth, Postgres, storage). Payments: Midtrans (+ BRI QRIS). Shipping: Biteship + RajaOngkir. Deployed to Vercel serverless.

UI and comments are in **Bahasa Indonesia**. Match that language for new UI text and comments.

## Commands

```bash
npm run dev          # Astro dev server on port 4321 (host 0.0.0.0)
npm run build        # astro build
npm run preview      # astro preview
```

There are **no** lint, typecheck, format, or test scripts configured. Run `npx astro check` for TypeScript diagnostics if needed. No test framework exists.

## Path Aliases

Defined in `tsconfig.json`:
- `@/*` → `src/*`
- `@/lib/*` → `src/lib/*`
- `@/components/*` → `src/components/*`
- `@/layouts/*` → `src/layouts/*`

Always use aliases instead of relative paths.

## Architecture

### Routing (file-based)

- `src/pages/` — all routes. `.astro` pages, `.ts` API endpoints.
- API endpoints in `src/pages/api/` are server-side only (never sent to browser).
- Middleware (`src/middleware.js`) protects `/cart`, `/checkout`, `/akun` routes. Unauthenticated users redirect to `/login`. Users without a `customers` row redirect to `/akun/lengkapi-profil`.

### Supabase Clients — Use the Right One

| Context | Client | Import |
|---------|--------|--------|
| Browser (React components) | `createBrowserClient` via `@supabase/ssr` | `@/lib/supabaseBrowserClient` → exported as `supabase` |
| Server (API routes, middleware) | `createServerClient` via `@supabase/ssr` | `@/lib/supabaseServer` → `supabaseServerClient(context)` |
| Admin (service role, bypasses RLS) | `createClient` via `@supabase/supabase-js` | `@/lib/supabaseServer` → exported as `supabaseAdmin` |

**Do not** create raw `createClient()` calls outside `supabaseServer.ts`. The `@supabase/ssr` package handles cookie-based auth correctly; raw clients break session management.

Server-side clients require the `APIContext` (from Astro) to access cookies. Pass it through or destructure from the route handler.

### State Management

Two stores coexist:
- **Zustand** (`@/lib/store.ts`) — cart, auth state, addresses, toasts. Used in React components.
- **Nanostores** (`src/stores/`) — lightweight reactive atoms. Used in `.astro` files and some React islands.

### Layouts

- `src/layouts/MainLayout.astro` — customer-facing shell (Header, Footer, PWA, toast, WhatsApp button).
- `src/layouts/AdminLayout.astro` — admin shell (minimal, CDN Tailwind).

### Components

Mix of `.astro` (static/SSR islands) and `.tsx`/`.jsx` (interactive React). Components are in `src/components/` flat — no subdirectories.

### i18n

Indonesian strings in `public/locales/id/common.json`. Use `i18next` for translations in client components.

## Environment Variables

Required (see `.env.example`): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `MIDTRANS_SERVER_KEY`, `PUBLIC_MIDTRANS_CLIENT_KEY`, `RAJAONGKIR_API_KEY`, `RAJAONGKIR_ORIGIN_ID`.

Additional in `.env`: `BITESHIP_API_KEY`, `BITESHIP_ORIGIN_*`, `BITESHIP_WEBHOOK_*`, `BRI_*` keys, `PAYMENT_GATEWAY`, and notification provider keys (`WHATSAPP_*` or `EMAIL_*`).

`SUPABASE_SERVICE_KEY` is the admin/service-role key — never expose to the browser (no `PUBLIC_` prefix).

## Supabase Database

Migrations are raw SQL in `supabase/migrations/`. Applied manually via Supabase SQL Editor — there is no `supabase` CLI config (`config.toml` does not exist).

Schema docs: `File SUPABASE/` and `File CATATAN/` contain JSON exports of tables, functions, triggers, views.

Key tables: `customers`, `products`, `orders`, `order_items`, `payments`, `customer_addresses`, `cart_items`, `profiles`, `wishlists`, `product_comparisons`, `loyalty_points`, `vouchers`.

DB functions (RPC): `get_cart_items`, `upsert_cart_item`, `update_cart_item_quantity`, `clear_cart`.

## Key Gotchas

- **No test/lint/format tooling** — verify changes manually or with `npx astro check`.
- **PWA** — `vite-plugin-pwa` with workbox. Manifest at `public/manifest.json`. Icons in `public/icons/`.
- **Two payment gateways** — Midtrans (primary) and BRI QRIS. Controlled by `PAYMENT_GATEWAY` env var.
- **Two shipping APIs** — Biteship (primary, with webhooks) and RajaOngkir. Code in `src/lib/biteship.ts` and `src/pages/api/rajaongkir/`.
- **Maps** — Leaflet for display, OSRM for routing (`src/lib/osrm.ts`). Origin data from env vars.
- **No CI/CD** — deployment is Vercel auto-deploy. No GitHub Actions.
- **DevContainer** installs `opencode-ai`, `supabase`, `vercel`, `uipro-cli` globally on create.
- **`eruda` debug console** is loaded in production via CDN in MainLayout — likely a dev artifact.

## Conventions

- `.astro` files use `---` frontmatter for server logic; `<script>` tags for client JS.
- API route handlers export `ALL`, `GET`, `POST`, etc. and receive `{ request, cookies, redirect, locals }` from Astro.
- `locals.session` and `locals.supabase` are set by middleware and available in all page/API handlers.
- Client-side Supabase calls import `supabase` from `@/lib/supabaseBrowserClient`.
- Images from Supabase Storage are served through Vercel's image optimization (configured in `astro.config.mjs`).
