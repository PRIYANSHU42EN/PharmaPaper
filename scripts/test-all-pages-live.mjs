/**
 * Live End-to-End HTTP Route Verification for PharmaPaper
 * Hits http://localhost:3000 for every public and admin route,
 * verifies HTTP 200 responses, tests content integrity,
 * and confirms non-negotiable funnel rules (Rule 1, 2, 5).
 */

const BASE_URL = "http://localhost:3000";

const routesToTest = [
  {
    name: "Home Page",
    path: "/",
    checks: ["Welcome to", "PharmaPaper", "Bachelor of Pharmacy", "View Notes"],
  },
  {
    name: "Semester Page (B.Pharm 1st Sem)",
    path: "/bpharm/1st-semester",
    checks: ["B.Pharm Semester I Notes", "Select Your Subject", "Open Subject"],
    forbidden: ["TimedDownloadButton", "unit-1_notes.pdf"], // Rule 5: No units or downloads directly on Semester page
  },
  {
    name: "Subject Page (Python for Pharma)",
    path: "/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences",
    checks: ["Basics of Python Programming", "Select Your Unit", "Open Unit"],
    forbidden: ["Download PDF Notes", "Download Now", ".pdf"], // Rule 5: No download button on Subject page
  },
  {
    name: "Unit Page (Unit 1)",
    path: "/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences/unit-1",
    checks: ["Unit 1", "Download Verified Lecture Notes", "Download PDF Notes", "Student Discussion &amp; Comments"],
  },
  {
    name: "All Posts Page",
    path: "/posts",
    checks: ["Pharmacy Career Guides"],
  },
  {
    name: "About Page",
    path: "/about",
    checks: ["About PharmaPaper", "Our Mission", "PCI"],
  },
  {
    name: "Contact Page",
    path: "/contact",
    checks: ["Contact Us", "pharmapaperofficial@zohomail.in"],
  },
  {
    name: "Privacy Policy Page",
    path: "/privacy",
    checks: ["Privacy Policy", "Data"],
  },
  {
    name: "Privacy Policy Alias (/privacy-policy)",
    path: "/privacy-policy",
    checks: ["Privacy Policy"],
  },
  {
    name: "Terms & Conditions Page",
    path: "/terms",
    checks: ["Terms &amp; Conditions"],
  },
  {
    name: "Disclaimer Page",
    path: "/disclaimer",
    checks: ["Disclaimer", "Educational Purpose Only"],
  },
  {
    name: "Admin Overview Dashboard",
    path: "/admin",
    checks: ["Loading Admin..."],
  },
  {
    name: "Admin Content CRUD",
    path: "/admin/content",
    checks: ["Loading Admin..."],
  },
  {
    name: "Admin Moderation Queue",
    path: "/admin/moderation",
    checks: ["Loading Admin..."],
  },
  {
    name: "Admin Analytics",
    path: "/admin/analytics",
    checks: ["Loading Admin..."],
  },
  {
    name: "Sitemap XML",
    path: "/sitemap.xml",
    checks: ["<urlset", "<loc>", "bpharm/1st-semester", "unit-1"],
  },
  {
    name: "Robots TXT",
    path: "/robots.txt",
    checks: ["User-Agent", "Allow: /", "Disallow: /admin/", "sitemap.xml"],
  },
];

async function runLiveTests() {
  console.log("=================================================");
  console.log(`LIVE HTTP VERIFICATION ON ${BASE_URL}`);
  console.log("=================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  for (const route of routesToTest) {
    const url = `${BASE_URL}${route.path}`;
    try {
      const res = await fetch(url);
      const text = await res.text();

      if (res.status !== 200) {
        console.error(`❌ [FAIL] ${route.name} (${route.path}) returned HTTP ${res.status}`);
        failedCount++;
        continue;
      }

      let testFailed = false;
      const missingChecks = [];
      for (const check of route.checks || []) {
        if (!text.includes(check)) {
          testFailed = true;
          missingChecks.push(check);
        }
      }

      const violatedForbidden = [];
      for (const forbidden of route.forbidden || []) {
        if (text.includes(forbidden)) {
          testFailed = true;
          violatedForbidden.push(forbidden);
        }
      }

      if (testFailed) {
        let msg = "";
        if (missingChecks.length > 0) msg += ` Missing expected text: [${missingChecks.join(", ")}]`;
        if (violatedForbidden.length > 0) msg += ` VIOLATION - Contains forbidden text: [${violatedForbidden.join(", ")}]`;
        console.error(`❌ [FAIL] ${route.name} (${route.path}):${msg}`);
        failedCount++;
      } else {
        console.log(`✅ [PASS] ${route.name} (${route.path}) - HTTP 200 OK, content verified.`);
        passedCount++;
      }
    } catch (err) {
      console.error(`❌ [ERROR] Could not fetch ${url}: ${err.message}`);
      failedCount++;
    }
  }

  console.log("\n=================================================");
  console.log(`LIVE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL LIVE ROUTES ARE HEALTHY, FUNCTIONAL, AND RULE-COMPLIANT!");
    process.exit(0);
  }
}

runLiveTests();
