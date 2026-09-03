# implementation.md — Pharmdbm Build Plan

How to use this file: give Antigravity `skill.md`, `design.md`, `tech.md`, and this file together. This file is the **order of operations** — build in these phases, in sequence, and don't start a phase until the previous one's checklist is done.

---

## Step 2 — Codebase Purge & Cleanup (Completed)
- [x] Safety backup branch created (`pre-step2-removal-backup`)
- [x] Removed marketing extra pages (`/pricing`, `/refund`) & pricing CTA
- [x] Retained legal pages (`/contact`, `/privacy`, `/terms`)
- [x] Retained `/app/login` with working Clerk authentication
- [x] Removed student learning app routes (`/app/dashboard`, `/app/feed`, `/app/videos`, `/app/notes`, `/app/subject`, `/app/pyq`, `/app/quiz`, `/app/signup`, `/app/profile`, `/app/settings`, `/app/upgrade`, `/app/demo-pay`)
- [x] Removed lecturer portal routes & components (`/app/lecturer/*`, `LecturerLayout`)
- [x] Cleaned Admin panel: removed users, videos, API monitor, DB console, security center, health, settings
- [x] Rebuilt Admin overview into plain dashboard shell (`/admin`)
- [x] Rebuilt Admin analytics into per-unit download counts list (`/admin/analytics`)
- [x] Rebuilt Admin content manager tabs for Semesters, Subjects, Units, Downloads (`/admin/content`)
- [x] Retained & trimmed comment moderation queue (`/admin/moderation` + `/api/v1/admin/moderation`)
- [x] Cleaned Backend APIs: removed razorpay, trials, lecturer, videos, notifications, users, bookmarks, quiz, referral, newsletter, payments, cron
- [x] Preserved kept APIs: `/api/pdf-proxy`, `/api/search`
- [x] Cleaned out-of-scope components (`HeroCanvas`, `BlurText`, `PaywallModal`, etc.)
- [x] Confirmed `FloatingCard` is retained for home semester cards
- [x] Created SQL migration `20260903000000_step2_drop_extra_tables.sql` to drop out-of-scope tables while keeping `courses`, `rate_limit_config`, `api_logs`, `ip_blocklist`, `suspicious_activity`
- [x] Uninstalled unused npm dependencies (`razorpay`, `three`, `@react-three/*`, `gsap`, `react-player`, `@dnd-kit/*`)
- [x] Verified zero-error Next.js production build (`npm run build`)

---

## Phase 0 — Project Setup
- [x] Create/connect Supabase project (`pcvvdcbivqzqrwrwowlp`)
- [x] Modern Next.js 16 + React 19 App Router configured with dynamic routing
- [x] Install/verify dependencies: `@supabase/supabase-js`, `tailwindcss`, `lucide-react`, `framer-motion`, `@clerk/nextjs`
- [x] Configure Tailwind design tokens and CSS variables
- [x] Create `.env.local` with Supabase and Upstash keys
- [x] Create `src/lib/supabase.ts` typed query client

## Phase 1 — Database
- [x] Run the core schema from `tech.md` (`semesters`, `subjects`, `units`, `downloads`, `download_logs`) in Supabase
- [x] Run the v2 schema additions (`content_html` columns, `comments`, `posts`)
- [x] Verify all RLS policies are enabled and correct (public read, admin write, anon insert on `comments`/`download_logs`)
- [x] Create the `notes-pdfs` public Storage bucket
- [x] Seeded 10 semesters, 60 subjects, 300 units, 300 downloads, and 4 posts in Supabase

## Phase 2 — Global Layout
- [x] `Navbar` (sticky, warm yellow background `#FBC02D`, BPHARM & DPHARM dropdowns, mobile hamburger)
- [x] `Footer` (About Us, Contact Us, Privacy Policy, Terms, Disclaimer)
- [x] `FloatingSocialIcons` (Telegram, WhatsApp, YouTube)
- [x] Wire up Next.js App Router dynamic routes (`/[course]/[semesterSlug]`, `/[course]/[semesterSlug]/[subjectSlug]`, `/[course]/[semesterSlug]/[subjectSlug]/[unitSlug]`)
- [x] Confirm layout renders correctly on mobile/tablet/desktop breakpoints

## Phase 3 — Home Page
- [x] `Hero` component (Welcome to Pharmdbm, search input, PCI features, vector illustration)
- [x] `SemesterGrid` — fetch all semesters from Supabase, render 8 B.Pharm cards and 2 D.Pharm cards
- [x] Each card links to `/:course/:semesterSlug`
- [x] Course tab switcher (B.Pharm vs D.Pharm)

## Phase 4 — Semester Page
- [x] `Sidebar` component (`SearchBox` + `RecentPosts`, pulling from the `posts` table)
- [x] `SemesterDetail` page: fetch semester by slug, fetch its subjects ordered by `order_index`
- [x] `SubjectList` — vertical list of gradient pill buttons, one per subject
- [x] Render the semester's `content_html` article
- [x] `CommentSection` (form + list of approved comments for this semester)
- [x] Confirm this page does **not** render any unit or download UI (per `skill.md` rule 5)

## Phase 5 — Subject Page
- [x] `SubjectDetail` page: fetch subject by slug (scoped to its semester), fetch its units ordered by `order_index`
- [x] `UnitList` — "Open Unit 1" … "Open Unit N" pill buttons, each linking to the unit page
- [x] Render the subject's `content_html` article
- [x] `SubjectPager` (prev/next sibling subject within the same semester)
- [x] `CommentSection`
- [x] Confirm no `TimedDownloadButton` appears here either (per `skill.md` rule 5)

## Phase 6 — Unit Page & Download Timer
- [x] `UnitDetail` page: fetch unit by slug (scoped to its subject), fetch its `downloads` row
- [x] Build `TimedDownloadButton` exactly per the spec in `skill.md` and `design.md`:
  - [x] Idle state → click → countdown state (random 5–10s, circular progress ring, `aria-live="polite"`)
  - [x] Ready state → "Download Now" → opens `file_url`
  - [x] Insert into `download_logs` on final click
- [x] Render the unit's `content_html` (short description)
- [x] `CommentSection`
- [x] Gated by timer (no raw `<a href>` leakage anywhere in UI)

## Phase 7 — Static & Legal Pages
- [x] About Us (`/about`), Contact Us (`/contact`), Privacy Policy (`/privacy`, `/privacy-policy`), Terms and Conditions (`/terms`), Disclaimer (`/disclaimer`)

## Phase 8 — Admin Auth & Dashboard
- [x] Protected Admin Layout and Auth allowlist
- [x] CRUD screens: Semesters, Subjects, Units, Downloads (`/admin/content`)
- [x] Comments moderation queue (`/admin/moderation` + `/api/v1/admin/moderation`)
- [x] Analytics screen: download counts per unit/subject from `download_logs` (`/admin/analytics`)

## Phase 9 — SEO
- [x] Dynamic metadata (`generateMetadata`) on every page: unique `<title>`, `<meta description>`
- [x] Dynamic sitemap generation script (`src/app/sitemap.ts`) covering all semester/subject/unit slugs
- [x] Verified heading hierarchy (`h1` → `h2` → `h3`) matching the semester → subject → unit structure
- [x] Robots directive (`src/app/robots.ts`)

## Phase 10 — QA Pass
- [x] Click through the full funnel end-to-end: Home → Semester → Subject → Unit → Download
- [x] Responsive layout on mobile, tablet, and desktop
- [x] Comment submission with moderation queue
- [x] Admin dashboard data retrieval and operations
- [x] Zero-error production build (`npm run build` completed with 0 errors)

## Phase 11 — Deployment
- [ ] Push repo to GitHub
- [ ] Connect to Vercel, set env vars in project settings
- [ ] Deploy, then re-run the Phase 10 QA pass against the live URL
- [ ] Submit sitemap to Google Search Console

---

## Definition of Done
The build is complete when every checkbox above is checked, the four-level funnel and download-timer rules from `skill.md` are intact, and the site visually matches `design.md` on mobile, tablet, and desktop.
