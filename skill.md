---
name: pharmapaper-app-builder
description: Use this skill whenever building, extending, or fixing the PharmaPaper React + Supabase notes platform. Covers project conventions, data model, and the timed-download feature so any AI agent working on this repo stays consistent with prior decisions. Trigger on any request touching semesters, subjects, units, downloads, the admin dashboard, or the countdown-download button.
---

# PharmaPaper App — Agent Conventions

Read `design.md` and `tech.md` in this same folder first — they hold the visual spec and the full technical spec (schema, routes, stack). This file holds the *rules* to follow while building or modifying the codebase, not the spec itself.

## Non-negotiable product rules
1. **Download flow is always gated by the timer.** Every unit's PDF link goes through `TimedDownloadButton` — never render a raw `<a href>` to a PDF anywhere in the public UI.
2. **Timer window is 5–10 seconds**, randomized per click, defined as named constants (`MIN_WAIT`, `MAX_WAIT`) in one place — never hardcoded inline in a component.
3. **Public users never get write access.** All inserts/updates/deletes to `semesters`, `subjects`, `units`, `downloads` must go through an authenticated admin session — never weaken the RLS policies in `tech.md` to make a feature easier to build.
4. **`download_logs` inserts are the one exception** anon users can write — used only for the analytics counter, never exposed for public reads.
5. **The public site is a four-level funnel: Home → Semester → Subject → Unit.** The Semester page lists subjects only; the Subject page lists units only ("Open Unit N"); the `TimedDownloadButton` (and therefore the real file URL) may only ever render on the Unit page. Never shortcut the funnel by putting a download link on an earlier page.

## Code conventions
- Components: PascalCase filenames matching the component name (`TimedDownloadButton.jsx`).
- Data access: all Supabase calls go through `src/lib/supabaseClient.js` + the `src/hooks/*` hooks — no ad-hoc `createClient()` calls scattered in components.
- Styling: Tailwind utility classes only; no inline `style={}` unless animating a value Tailwind can't express.
- New pages get added to `src/pages/` and wired into `App.jsx`'s router — keep route paths consistent with the table in `tech.md`.
- Any new database column or table: update `supabase/schema.sql` in the same change, including its RLS policy — schema and code must never drift apart.
- Semester, Subject, and Unit pages must render the shared `Sidebar` (Search + Recent Posts), their own `content_html` article, and `CommentSection` — don't strip these for a simpler layout without checking `design.md` first.

## When adding a new feature
1. Check `design.md` for whether a visual pattern already exists (card style, button style, spacing) before inventing a new one.
2. Check `tech.md` for whether a table/column already covers the need before adding a new one.
3. If the feature touches the admin dashboard, it must respect the `ProtectedRoute` auth check — never add an admin-only action reachable from a public route.
4. If the feature adds a new content type (e.g. a "reference books" table), follow the existing pattern: uuid primary key, `order_index` for manual sorting, `created_at` timestamp, RLS mirroring the existing tables.

## Things to avoid
- Don't reintroduce the old static-page-per-semester approach — content lives in Supabase, pages are data-driven templates.
- Don't bypass the timer "for testing" and leave it bypassed in the shipped build.
- Don't add tracking/analytics beyond `download_logs` without flagging it — keep the data model minimal and privacy-respecting (no IP storage, no third-party trackers by default).
- Don't hardcode Supabase URL/keys — always read from env vars per `.env.example` in `tech.md`.
