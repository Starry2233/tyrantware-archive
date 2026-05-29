# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Setup
bun install
cp apps/api/.env.example apps/api/.env
bun run init:api                  # Initialize SQLite schema

# Development
bun run dev                       # Start all dev servers concurrently (API + both frontends)
bun run dev:api                   # API server only (hot reload via bun --watch)
bun run dev:public                # Public frontend only (Vite dev)
bun run dev:admin                 # Admin frontend only (Vite dev)
bun run dev:gh-pages              # Public frontend in pure frontend mode (no API needed)

# Build & Type-check
bun run build                     # Build all workspaces (API + frontends)
bun run build:gh-pages            # Build public frontend for GitHub Pages (pure frontend mode)
bun run check                     # tsc type-check all workspaces
```

## Project Architecture

Bun monorepo (workspaces: `apps/*`, `packages/*`) — Tyrantware Archive, a registry for documenting proprietary software malware behaviors, inspired by [GNU's proprietary malware documentation](https://gnu.org/proprietary/).

### Workspaces

- **`apps/api`** — Hono backend, deployed to Vercel. SQLite via Turso (Drizzle ORM, `libsql/http` driver). JWT admin auth (jose), DB-backed rate limiting, base64 image storage.
- **`apps/public`** — Svelte 5 public frontend. Pages: Home, Search, Submit, Correction, Success.
- **`apps/admin`** — Svelte 5 admin panel. Pages: Login, Dashboard (review submissions/corrections, manage archive).
- **`packages/shared`** — Shared types (`Vendor`, `MalwareCategory`, `MalwareEntry`, `PendingSubmission`, etc.), constants (`vendors`, `malwareCategories`, `apiPaths`), CSS, and a `NotFound.svelte` component.

### Database (SQLite via Turso, 7 tables)

| Table | Purpose |
|---|---|
| `malware_entries` | Core records of proprietary software malware, unique on (vendor, software_name) |
| `submissions` | User-submitted malware evidence, status: pending/approved/rejected |
| `submission_images` | Images uploaded with submissions (base64) |
| `malware_entry_images` | Images on malware entries (base64) |
| `corrections` | Correction requests against archive entries |
| `submission_traces` | Request/network metadata captured during submission |
| `rate_limit_events` | Per-IP rate tracking with periodic cleanup |

### API Layout (`apps/api/src/lib/http.ts`)

- **Public routes**:
  - `GET/POST /api/search` — check if vendor+software_name is in the archive
  - `POST /api/submissions` — multipart form submission with up to 4 images
  - `POST /api/corrections` — JSON body
  - `GET /api/public-images/:id` — serve malware entry images with cache

- **Admin routes** (require JWT Bearer token):
  - `POST /api/admin/login` — returns JWT (configurable expiry, default 10min)
  - `GET /api/admin/dashboard` — pending submissions, corrections, full archive
  - `POST /api/admin/submissions/:id/approve|reject`
  - `POST /api/admin/corrections/:id/approve|reject`
  - `POST /api/admin/malware/:id/delete`
  - `GET /api/admin/submission-images/:id`, `/api/admin/malware-images/:id`

### Key Design Details

- Environment config in `apps/api/src/lib/env.ts`. Required vars: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`), `JWT_SECRET`.
- Validation in `apps/api/src/lib/validate.ts`: vendor whitelist, software_name ASCII-only, malware category enum, image type/size limits.
- Rate limiting in `apps/api/src/lib/rate.ts`: scoped per-IP with DB tracking and periodic stale entry cleanup.
- Images stored as base64 TEXT in SQLite (no filesystem/blob storage needed).
- Admin auth persists to localStorage under key `tyrantware-admin-auth`.
- Svelte 5 uses runes (`$state`, `$derived`, `$effect`) — no stores.
- Router: `@mateothegreat/svelte5-router` with async component imports and `use:route` action for `<a>` links.
- Security headers applied globally: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`.
