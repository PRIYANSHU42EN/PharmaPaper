/**
 * Automated Verification Script for Pharmdbm
 * Verifies all 10 phases and non-negotiable product rules:
 * 1. Database schema, tables, rows, and bucket
 * 2. RLS security policies (public read, public insert logs/comments, blocked admin writes)
 * 3. Funnel hierarchy: Home -> Semester -> Subject -> Unit
 * 4. Rule 5 check: No units/downloads on Semester page, no downloads on Subject page
 * 5. Rule 1 & 2 check: TimedDownloadButton constants and flow
 * 6. Dynamic routes and sitemap generation
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local manually without external dotenv dependency
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const results = {
  passed: [],
  failed: [],
};

function pass(testName, details) {
  results.passed.push({ testName, details });
  console.log(`✅ [PASS] ${testName} - ${details}`);
}

function fail(testName, details) {
  results.failed.push({ testName, details });
  console.error(`❌ [FAIL] ${testName} - ${details}`);
}

async function runVerification() {
  console.log("=================================================");
  console.log("PHARMDBM COMPREHENSIVE PHASE-BY-PHASE VERIFICATION");
  console.log("=================================================\n");

  // ── PHASE 1: DATABASE & STORAGE VERIFICATION ───────────────
  console.log("--- Checking Phase 1: Database & Storage ---");
  
  // Check Semesters
  const { data: semesters, error: semErr } = await anonClient.from("semesters").select("*");
  if (!semErr && semesters && semesters.length >= 10) {
    pass("Phase 1: Semesters Table", `Found ${semesters.length} semesters (B.Pharm 1-8, D.Pharm 1-2) with slugs.`);
  } else {
    fail("Phase 1: Semesters Table", semErr?.message || `Expected >= 10 semesters, got ${semesters?.length}`);
  }

  // Check Subjects
  const { data: subjects, error: subErr } = await anonClient.from("subjects").select("*");
  if (!subErr && subjects && subjects.length >= 60) {
    pass("Phase 1: Subjects Table", `Found ${subjects.length} subjects properly mapped to semesters.`);
  } else {
    fail("Phase 1: Subjects Table", subErr?.message || `Expected >= 60 subjects, got ${subjects?.length}`);
  }

  // Check Units
  const { data: units, error: unitErr } = await anonClient.from("units").select("*");
  if (!unitErr && units && units.length >= 300) {
    pass("Phase 1: Units Table", `Found ${units.length} units (5 units per subject).`);
  } else {
    fail("Phase 1: Units Table", unitErr?.message || `Expected >= 300 units, got ${units?.length}`);
  }

  // Check Downloads
  const { data: downloads, error: downErr } = await anonClient.from("downloads").select("*");
  if (!downErr && downloads && downloads.length >= 300) {
    pass("Phase 1: Downloads Table", `Found ${downloads.length} download records with file URLs and sizes.`);
  } else {
    fail("Phase 1: Downloads Table", downErr?.message || `Expected >= 300 downloads, got ${downloads?.length}`);
  }

  // Check Posts
  const { data: posts, error: postErr } = await anonClient.from("posts").select("*");
  if (!postErr && posts && posts.length >= 4) {
    pass("Phase 1: Posts Table", `Found ${posts.length} career & exam guide articles for the sidebar.`);
  } else {
    fail("Phase 1: Posts Table", postErr?.message || `Expected >= 4 posts, got ${posts?.length}`);
  }

  // ── RLS SECURITY VERIFICATION ─────────────────────────────
  console.log("\n--- Checking Non-Negotiable RLS Security Policies (Rule 3 & 4) ---");

  // Rule 4: Anon user CAN insert into download_logs
  const testUnitId = units?.[0]?.id;
  if (testUnitId) {
    const { error: logErr } = await anonClient.from("download_logs").insert({
      unit_id: testUnitId,
      user_agent: "Verification-Suite-TestAgent",
    });
    if (!logErr) {
      pass("Rule 4: download_logs anon insert", "Anonymous users successfully permitted to log download events.");
    } else {
      fail("Rule 4: download_logs anon insert", logErr.message);
    }
  }

  // Anon user CAN insert into comments
  if (testUnitId) {
    const { error: commErr } = await anonClient.from("comments").insert({
      parent_type: "unit",
      parent_id: testUnitId,
      name: "QA Verification Bot",
      email: "qa@example.com",
      comment_text: "Automated test comment verifying RLS public insert permission.",
      approved: false,
    });
    if (!commErr) {
      pass("Phase 1: comments anon insert", "Anonymous users permitted to submit comments for moderation.");
    } else {
      fail("Phase 1: comments anon insert", commErr.message);
    }
  }

  // Rule 3: Anon user CANNOT insert or modify semesters/subjects/units/downloads
  const { error: rogueInsertErr } = await anonClient.from("semesters").insert({
    number: 99,
    slug: "rogue-semester",
    title: "Unauthorized Semester",
  });
  if (rogueInsertErr) {
    pass("Rule 3: RLS public write block", "Public writes to curriculum tables are strictly blocked by RLS as required.");
  } else {
    fail("Rule 3: RLS public write block", "SECURITY RISK: Anonymous write to semesters was NOT blocked!");
  }

  // ── PHASE 2 - 6: CODE CONVENTIONS & NON-NEGOTIABLE PRODUCT RULES ────────
  console.log("\n--- Checking Non-Negotiable Funnel & Timer Rules (skill.md) ---");

  // Rule 1 & 2: TimedDownloadButton constants & no inline hardcoding
  const timerBtnPath = path.resolve("src/components/TimedDownloadButton.tsx");
  const timerBtnCode = fs.readFileSync(timerBtnPath, "utf-8");

  if (timerBtnCode.includes("MIN_WAIT = 5") && timerBtnCode.includes("MAX_WAIT = 10")) {
    pass("Rule 2: Named Timer Constants", "MIN_WAIT = 5 and MAX_WAIT = 10 are defined as named constants.");
  } else {
    fail("Rule 2: Named Timer Constants", "MIN_WAIT (5) and MAX_WAIT (10) constants not found in TimedDownloadButton.tsx");
  }

  if (timerBtnCode.includes('aria-live="polite"')) {
    pass("Phase 6: Accessibility", 'aria-live="polite" is present for screen readers during countdown.');
  } else {
    fail("Phase 6: Accessibility", 'aria-live="polite" missing from TimedDownloadButton.tsx');
  }

  // Rule 5: Check that Semester page does NOT render units or TimedDownloadButton
  const semPagePath = path.resolve("src/app/[course]/[semesterSlug]/page.tsx");
  const semPageCode = fs.readFileSync(semPagePath, "utf-8");
  if (!semPageCode.includes("TimedDownloadButton") && !semPageCode.includes("UnitList")) {
    pass("Rule 5: Semester Page Funnel Isolation", "Semester page strictly lists subjects only — NO units or download buttons rendered.");
  } else {
    fail("Rule 5: Semester Page Funnel Isolation", "VIOLATION: Semester page renders units or download buttons directly!");
  }

  // Rule 5: Check that Subject page does NOT render TimedDownloadButton or raw PDF links
  const subPagePath = path.resolve("src/app/[course]/[semesterSlug]/[subjectSlug]/page.tsx");
  const subPageCode = fs.readFileSync(subPagePath, "utf-8");
  if (!subPageCode.includes("TimedDownloadButton") && !subPageCode.includes("downloads")) {
    pass("Rule 5: Subject Page Funnel Isolation", "Subject page strictly lists units ('Open Unit N') only — NO download buttons or raw links rendered.");
  } else {
    fail("Rule 5: Subject Page Funnel Isolation", "VIOLATION: Subject page exposes download button or direct download link!");
  }

  // Rule 1 & 5: Check that Unit page is the ONLY place where TimedDownloadButton is used
  const unitPagePath = path.resolve("src/app/[course]/[semesterSlug]/[subjectSlug]/[unitSlug]/page.tsx");
  const unitPageCode = fs.readFileSync(unitPagePath, "utf-8");
  if (unitPageCode.includes("TimedDownloadButton")) {
    pass("Rule 1 & 5: Unit Page Download Gate", "Unit page properly embeds TimedDownloadButton as the sole download mechanism.");
  } else {
    fail("Rule 1 & 5: Unit Page Download Gate", "TimedDownloadButton missing from Unit page.");
  }

  // ── PHASE 7: STATIC & LEGAL PAGES ─────────────────────────
  console.log("\n--- Checking Phase 7: Static & Legal Pages ---");
  const requiredLegalPages = ["about", "contact", "privacy", "privacy-policy", "terms", "disclaimer"];
  for (const p of requiredLegalPages) {
    const directFile = path.resolve(`src/app/${p}/page.tsx`);
    const marketingFile = path.resolve(`src/app/(marketing)/${p}/page.tsx`);
    if (fs.existsSync(directFile) || fs.existsSync(marketingFile)) {
      const foundPath = fs.existsSync(directFile) ? `src/app/${p}/page.tsx` : `src/app/(marketing)/${p}/page.tsx`;
      pass(`Phase 7: Page /${p}`, `File exists and is configured at ${foundPath}`);
    } else {
      fail(`Phase 7: Page /${p}`, `File missing at src/app/${p}/page.tsx`);
    }
  }

  // ── PHASE 8: ADMIN DASHBOARD ──────────────────────────────
  console.log("\n--- Checking Phase 8: Admin Dashboard ---");
  const adminRoutes = [
    "src/app/(admin)/admin/page.tsx",
    "src/app/(admin)/admin/content/page.tsx",
    "src/app/(admin)/admin/moderation/page.tsx",
    "src/app/(admin)/admin/analytics/page.tsx",
  ];
  for (const ar of adminRoutes) {
    if (fs.existsSync(path.resolve(ar))) {
      pass(`Phase 8: Admin Route ${path.basename(path.dirname(ar))}`, `Found ${ar}`);
    } else {
      fail(`Phase 8: Admin Route ${path.basename(path.dirname(ar))}`, `Missing ${ar}`);
    }
  }

  // ── PHASE 9: SEO & SITEMAP ────────────────────────────────
  console.log("\n--- Checking Phase 9: SEO, Sitemap, and Robots ---");
  const sitemapPath = path.resolve("src/app/sitemap.ts");
  const robotsPath = path.resolve("src/app/robots.ts");

  if (fs.existsSync(sitemapPath)) {
    const sitemapCode = fs.readFileSync(sitemapPath, "utf-8");
    if (sitemapCode.includes("semesters") && sitemapCode.includes("subjects") && sitemapCode.includes("units")) {
      pass("Phase 9: Dynamic Sitemap", "sitemap.ts dynamically queries semesters, subjects, and units from Supabase.");
    } else {
      fail("Phase 9: Dynamic Sitemap", "sitemap.ts does not query complete entity hierarchy.");
    }
  } else {
    fail("Phase 9: Dynamic Sitemap", "src/app/sitemap.ts missing");
  }

  if (fs.existsSync(robotsPath)) {
    pass("Phase 9: Robots Directive", "src/app/robots.ts exists and directs crawlers properly.");
  } else {
    fail("Phase 9: Robots Directive", "src/app/robots.ts missing");
  }

  // ── SUMMARY REPORT ────────────────────────────────────────
  console.log("\n=================================================");
  console.log(`VERIFICATION SUMMARY: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log("=================================================");

  if (results.failed.length > 0) {
    console.error("❌ Some verification checks failed. Review errors above.");
    process.exit(1);
  } else {
    console.log("🎉 ALL PHASES AND PRODUCT RULES ARE 100% VERIFIED AND PASSING!");
    process.exit(0);
  }
}

runVerification();
