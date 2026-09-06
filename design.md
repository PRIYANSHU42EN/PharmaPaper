# design.md — Pharmdbm Visual & UX Specification

## Brand
- **Name:** Pharmdbm
- **Tagline:** "Your Gateway to Excellence in Pharmacy Education"
- **Primary color:** warm yellow `#FBC02D` (header/navbar background)
- **Accent colors:** blue→purple gradient (`from-blue-500 to-purple-600`) for buttons/pills
- **Success color:** green (for the unlocked "Download Now" state)
- **Neutral background:** white / very light gray (`#F9FAFB`) for content sections
- **Typography:** a clean rounded sans-serif (e.g. `Poppins` or `Inter`), bold weights for headings, medium for body
- **Icon set:** `lucide-react` throughout (BookOpen, Download, Search, Send, MessageCircle, Youtube, Clock)

## Global Layout
- **Navbar** — sticky, yellow background, logo + wordmark on the left. Links: Home, BPHARM (dropdown: 1st–8th Semester), DPHARM (dropdown), All Posts, About Us, Privacy Policy (dropdown), Contact Us. Collapses to a hamburger menu on mobile.
- **FloatingSocialIcons** — fixed vertical stack on the right edge (Telegram, WhatsApp, YouTube), circular buttons, brand colors, small hover-scale.
- **Two-column content layout** — Semester, Subject, and Unit pages use a ~70/30 split: main content on the left, `Sidebar` on the right (stacks below content on mobile). Home stays full-width.
- **Footer** — copyright left, link list right (About Us, Contact Us, Privacy Policy, Terms and Conditions, Disclaimer). Stacks centered on mobile.

## Page: Home
1. Hero section (two-column on desktop, stacked on mobile): heading "Welcome to Pharmdbm", subheading, short paragraph, illustration on the right.
2. Search bar (optional extra) below hero.
3. "Recently added notes" row (optional extra) — horizontal scroll of cards on mobile.
4. Semester grid — 8 `SemesterCard`s, 4 columns desktop / 2 tablet / 1 mobile, each a flat card with a book icon, semester number, "Notes" label, and a gradient pill button linking to that semester page. Replace the old AI-generated notebook illustration with a clean icon-based card for faster load and a more modern look.

## Page: Semester Detail (`/:course/:semesterSlug`)
Two-column layout: main content (~70%) + `Sidebar` (~30%).
1. Page header: semester title (e.g. "Bpharm 1st Semester Notes – All Subjects"), short intro paragraph.
2. "Select Your Subject to Download Notes" illustration (flat vector graphic).
3. Vertical list of subjects for that semester, in `order_index` order — each a full-width gradient pill button with the subject name, linking to `/:course/:semesterSlug/:subjectSlug`. **This page does not show units** — units live one level deeper, on the subject page.
4. Long-form SEO article rendered from the semester's `content_html` field — evergreen career/industry content an admin writes once (e.g. "MBA After B.Pharm – A Smart Move for Career Growth?").
5. `CommentSection` at the bottom (name/email/website/comment, "Leave a Comment" style).

## Page: Subject Detail (`/:course/:semesterSlug/:subjectSlug`)
Same two-column layout.
1. Page header: subject title (e.g. "Human Anatomy and Physiology 1 – Notes"), short intro paragraph.
2. "Select Your Unit to Download the Notes" illustration.
3. Vertical stack of gradient pill buttons, one per unit — "Open Unit 1" … "Open Unit N" — each linking to `/:course/:semesterSlug/:subjectSlug/:unitSlug`.
4. Long-form SEO article rendered from the subject's `content_html` field (e.g. "Why B.Pharm Graduates Are in High Demand").
5. `SubjectPager` — a compact "‹ Previous subject / Next subject ›" nav linking to sibling subjects in the same semester, by `order_index`.
6. `CommentSection` at the bottom.

## Page: Unit Detail (`/:course/:semesterSlug/:subjectSlug/:unitSlug`)
Same two-column layout.
1. Page header: unit title (e.g. "Unit 1 – Introduction to the Human Body").
2. Short unit description from the unit's `content_html` field (a sentence or two — good for SEO, optional).
3. `TimedDownloadButton` — this is the **only** place in the app where the real file link is ever exposed to a public user.
4. `CommentSection` at the bottom.

## Component: Sidebar
Appears on Semester, Subject, and Unit pages (not Home).
- `SearchBox` — input + button; searches subjects/units by name
- `RecentPosts` — 4–5 latest entries from the `posts` table, title + link, no excerpt in the compact widget
- Right column on desktop, collapses below main content on mobile

## Component: TimedDownloadButton
- **Idle state:** pill button, gradient background, label "Download PDF", download icon.
- **Counting state:** button is replaced by a compact countdown card — circular progress ring (or slim linear bar) with the remaining seconds centered inside, label below ("Preparing your download…"). No layout shift — reserve the same footprint as the idle button.
- **Ready state:** green pill button, label "Download Now", download icon, subtle pulse animation to draw attention.
- Motion: use Framer Motion for the idle→counting→ready transitions (fade/scale, ~200ms).
- Accessibility: `aria-live="polite"` region announces "X seconds remaining"; ready button gets a clear `aria-label="Download [unit title] PDF"`.

## Component: Admin Dashboard
- Left sidebar nav: Semesters, Subjects, Units, Downloads, Analytics, Logout.
- Each entity screen: table view + "Add new" button opening a modal form; inline edit/delete/reorder actions (up/down arrows or drag handle).
- Downloads screen: drag-and-drop file upload zone (to the `notes-pdfs` bucket) or a toggle to paste an external link instead.
- Analytics screen: simple bar list of download counts per unit/subject, sourced from `download_logs`.

## Responsive Breakpoints
- Mobile: < 640px — 1 column everywhere, hamburger nav
- Tablet: 640–1024px — 2 columns for grids
- Desktop: > 1024px — 4 columns for the semester grid, 2–3 for unit grids

## Motion & Micro-interactions
- Card hover: slight lift (`translate-y-1`) + shadow increase
- Button hover: scale 1.03
- Page transitions: simple fade (avoid heavy animation that slows perceived load time)

## Dark Mode (optional)
- Toggle in navbar; swap yellow header for a deep navy, cards to dark gray, text to light gray/white, keep the blue-purple gradient buttons as-is for brand consistency.
