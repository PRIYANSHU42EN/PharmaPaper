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
- [ ] Create a new Supabase project
- [ ] Create a new Vite + React project (`npm create vite@latest pharmdbm -- --template react`)
- [ ] Install dependencies: `react-router-dom`, `@supabase/supabase-js`, `tailwindcss`, `lucide-react`, `framer-motion`, `react-helmet-async`, `dompurify`
- [ ] Configure Tailwind (`tailwind.config.js`, `index.css`)
- [ ] Create `.env` from `.env.example` (see `tech.md`) and fill in Supabase URL/anon key
- [ ] Create `src/lib/supabaseClient.js`

## Phase 1 — Database
- [ ] Run the core schema from `tech.md` (`semesters`, `subjects`, `units`, `downloads`, `download_logs`) in the Supabase SQL editor
- [ ] Run the v2 schema additions (`content_html` columns, `comments`, `posts`)
- [ ] Verify all RLS policies are enabled and correct (public read, admin write, anon insert on `comments`/`download_logs`)
- [ ] Create the `notes-pdfs` public Storage bucket
- [ ] Manually insert one test row per table (1 semester, 1 subject, 1 unit, 1 download) to sanity-check the schema before building UI against it

## Phase 2 — Global Layout
- [ ] `Navbar` (sticky, yellow background, dropdowns, mobile hamburger)
- [ ] `Footer`
- [ ] `FloatingSocialIcons`
- [ ] Wire up `App.jsx` with `react-router-dom` routes from the table in `tech.md` (stub each page with a placeholder first)
- [ ] Confirm layout renders correctly on mobile/tablet/desktop breakpoints before moving on

## Phase 3 — Home Page
- [ ] `Hero` component
- [ ] `SemesterGrid` — fetch all semesters from Supabase, render 8 cards
- [ ] Each card links to `/:course/:semesterSlug`
- [ ] (Optional) "Recently added notes" row

## Phase 4 — Semester Page
- [ ] `Sidebar` component (`SearchBox` + `RecentPosts`, pulling from the `posts` table)
- [ ] `SemesterDetail` page: fetch semester by slug, fetch its subjects ordered by `order_index`
- [ ] `SubjectList` — vertical list of gradient pill buttons, one per subject
- [ ] Render the semester's `content_html` article (sanitized with `dompurify`)
- [ ] `CommentSection` (form + list of approved comments for this semester)
- [ ] Confirm this page does **not** render any unit or download UI (per `skill.md` rule 5)

## Phase 5 — Subject Page
- [ ] `SubjectDetail` page: fetch subject by slug (scoped to its semester), fetch its units ordered by `order_index`
- [ ] `UnitList` — "Open Unit 1" … "Open Unit N" pill buttons, each linking to the unit page
- [ ] Render the subject's `content_html` article
- [ ] `SubjectPager` (prev/next sibling subject within the same semester)
- [ ] `CommentSection`
- [ ] Confirm no `TimedDownloadButton` appears here either

## Phase 6 — Unit Page & Download Timer
- [ ] `UnitDetail` page: fetch unit by slug (scoped to its subject), fetch its `downloads` row
- [ ] Build `TimedDownloadButton` exactly per the spec in the earlier Antigravity prompt / `design.md`:
  - [ ] Idle state → click → countdown state (random 5–10s, progress ring/bar, `aria-live`)
  - [ ] Ready state → "Download Now" → opens `file_url`
  - [ ] Insert into `download_logs` on final click
- [ ] Render the unit's `content_html` (short description)
- [ ] `CommentSection`
- [ ] Manually test the full timer cycle at least 10 times, including slow network conditions

## Phase 7 — Static & Legal Pages
- [ ] About Us, Contact Us, Privacy Policy, Terms and Conditions, Disclaimer — static content pages using the same layout shell

## Phase 8 — Admin Auth & Dashboard
- [ ] Supabase Auth email/password login page
- [ ] `ProtectedRoute` wrapper (session check + admin email allowlist)
- [ ] CRUD screens: Semesters, Subjects, Units, Downloads (with file upload to `notes-pdfs`), Posts, Comments (moderation — approve/reject)
- [ ] Reordering controls (`order_index`) on Subjects and Units screens
- [ ] Analytics screen: download counts per unit/subject from `download_logs`

## Phase 9 — SEO
- [ ] `react-helmet-async` on every page: unique `<title>`, `<meta description>`, Open Graph tags
- [ ] Sitemap generation script covering all semester/subject/unit slugs
- [ ] Verify heading hierarchy (`h1` → `h2` → `h3`) matches the semester → subject → unit structure

## Phase 10 — QA Pass
- [ ] Click through the full funnel end-to-end: Home → Semester → Subject → Unit → Download
- [ ] Test on mobile viewport widths (375px, 414px) and desktop
- [ ] Test comment submission on all three levels
- [ ] Test admin login, one full CRUD cycle on each entity, and file upload
- [ ] Confirm RLS actually blocks writes when logged out (try an anon insert from the browser console — it should fail)
- [ ] Lighthouse pass for performance/SEO/accessibility scores

## Phase 11 — Deployment
- [ ] Push repo to GitHub
- [ ] Connect to Vercel, set env vars in project settings
- [ ] Deploy, then re-run the Phase 10 QA pass against the live URL
- [ ] Submit sitemap to Google Search Console

---

## Definition of Done
The build is complete when every checkbox above is checked, the four-level funnel and download-timer rules from `skill.md` are intact, and the site visually matches `design.md` on mobile, tablet, and desktop.
