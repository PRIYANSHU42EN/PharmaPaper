# tech.md — PharmaPaper Technical Specification

## Stack
- **Frontend:** React 18 + Vite, React Router v6, Tailwind CSS, lucide-react, Framer Motion (optional)
- **Backend:** Supabase — Postgres, Row Level Security, Auth, Storage
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend)
- **Data layer:** `@supabase/supabase-js`, optionally React Query for caching/invalidation

## Folder Structure
```
pharmdbm/
├─ src/
│  ├─ components/
│  │  ├─ Navbar.jsx
│  │  ├─ FloatingSocialIcons.jsx
│  │  ├─ Hero.jsx
│  │  ├─ SemesterGrid.jsx
│  │  ├─ SubjectList.jsx
│  │  ├─ UnitList.jsx
│  │  ├─ TimedDownloadButton.jsx
│  │  ├─ Sidebar.jsx (SearchBox + RecentPosts)
│  │  ├─ SubjectPager.jsx
│  │  ├─ CommentSection.jsx
│  │  └─ Footer.jsx
│  ├─ pages/
│  │  ├─ Home.jsx
│  │  ├─ SemesterDetail.jsx
│  │  ├─ SubjectDetail.jsx
│  │  ├─ UnitDetail.jsx
│  │  ├─ About.jsx / Contact.jsx / PrivacyPolicy.jsx / Terms.jsx / Disclaimer.jsx
│  │  └─ admin/ (Login.jsx, Dashboard.jsx, Semesters.jsx, Subjects.jsx, Units.jsx, Downloads.jsx, Posts.jsx, Comments.jsx, Analytics.jsx)
│  ├─ lib/supabaseClient.js
│  ├─ hooks/ (useSemesters.js, useSubjects.js, useUnits.js, useAuth.js)
│  ├─ routes/ProtectedRoute.jsx
│  └─ App.jsx
├─ supabase/schema.sql
├─ .env.example
└─ README.md
```

## Database Schema (Supabase / Postgres)
```sql
create extension if not exists "pgcrypto";

create table semesters (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  course text not null check (course in ('BPHARM','DPHARM')),
  title text not null,
  slug text unique not null,
  cover_image_url text,
  created_at timestamptz default now()
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index int default 0,
  created_at timestamptz default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  unit_number int not null,
  title text not null,
  order_index int default 0
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size_kb int,
  uploaded_at timestamptz default now()
);

create table download_logs (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete cascade,
  downloaded_at timestamptz default now(),
  user_agent text
);

alter table semesters enable row level security;
alter table subjects enable row level security;
alter table units enable row level security;
alter table downloads enable row level security;
alter table download_logs enable row level security;

create policy "public read semesters" on semesters for select using (true);
create policy "public read subjects" on subjects for select using (true);
create policy "public read units" on units for select using (true);
create policy "public read downloads" on downloads for select using (true);

create policy "admin write semesters" on semesters for all using (auth.role() = 'authenticated');
create policy "admin write subjects" on subjects for all using (auth.role() = 'authenticated');
create policy "admin write units" on units for all using (auth.role() = 'authenticated');
create policy "admin write downloads" on downloads for all using (auth.role() = 'authenticated');

create policy "public insert logs" on download_logs for insert with check (true);
create policy "admin read logs" on download_logs for select using (auth.role() = 'authenticated');
```

## Schema Additions (v2 — subject/unit pages, sidebar, comments)
```sql
-- long-form SEO article content, editable per page
alter table semesters add column content_html text;
alter table subjects add column content_html text;
alter table units add column content_html text;

-- "Leave a Comment" on semester/subject/unit pages
create table comments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('semester','subject','unit')),
  parent_id uuid not null,
  name text not null,
  email text not null,
  website text,
  comment_text text not null,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table comments enable row level security;
create policy "public insert comments" on comments for insert with check (true);
create policy "public read approved comments" on comments for select using (approved = true);
create policy "admin manage comments" on comments for all using (auth.role() = 'authenticated');

-- sidebar "Recent Posts" widget (job updates / news, independent of the notes hierarchy)
create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content_html text,
  published_at timestamptz default now()
);

alter table posts enable row level security;
create policy "public read posts" on posts for select using (true);
create policy "admin write posts" on posts for all using (auth.role() = 'authenticated');
```

## Storage
- Public bucket: `notes-pdfs`
- Admin uploads write here; store the returned public URL in `downloads.file_url`
- If files are hosted externally (Drive/Telegram), just store the external URL directly instead — no schema change needed

## Routes
| Path | Purpose |
|---|---|
| `/` | Home — semester grid |
| `/:course/:semesterSlug` | Semester page — subject list + SEO article (e.g. `/bpharm/1st-semester`) |
| `/:course/:semesterSlug/:subjectSlug` | Subject page — "Open Unit N" list + SEO article |
| `/:course/:semesterSlug/:subjectSlug/:unitSlug` | Unit page — the actual `TimedDownloadButton` |
| `/admin/login` | Admin auth |
| `/admin/dashboard/*` | Protected CRUD panel |
| `/about`, `/contact`, `/privacy-policy`, `/terms`, `/disclaimer` | Static pages |
| `*` | 404 |

## Auth
- Supabase Auth, email/password
- `ProtectedRoute` checks for an active session **and** that the user's email is in an admin allowlist (env var or a small `admins` table)

## SEO
- `react-helmet-async` for per-page `<title>` / `<meta name="description">` / Open Graph tags
- Auto-generated `sitemap.xml` (build-time script pulling all semester/subject/**unit** slugs from Supabase — every unit now has its own indexable URL)
- Semantic heading hierarchy: page `h1` → subject `h2` → unit `h3`
- `content_html` fields on semesters/subjects/units back the long-form article each page needs for search ranking — render with a sanitizer (e.g. `dompurify`) since it's admin-authored HTML

## Environment Variables (`.env.example`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_ALLOWLIST=admin@example.com
```

## Deployment
1. Create Supabase project → run `supabase/schema.sql` in the SQL editor
2. Create the `notes-pdfs` storage bucket, set it to public
3. Set env vars locally and in Vercel project settings
4. `npm install && npm run dev` to verify locally
5. Push to GitHub, connect repo to Vercel, deploy

## Performance Notes
- Lazy-load route components with `React.lazy` / `Suspense`
- Lazy-load below-the-fold images (`loading="lazy"`)
- Cache Supabase reads with React Query (`staleTime` a few minutes — content changes infrequently)
