import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUploadFlow() {
  console.log("=== TESTING ADMIN PDF UPLOAD API ===");

  // 1. Get first unit
  const { data: unit } = await supabase
    .from("units")
    .select("id, title, unit_number, subjects(name)")
    .limit(1)
    .single();

  console.log("Found unit to test with:", unit.title, "ID:", unit.id);

  // 2. Call upload API using a direct URL / simulated PDF
  const formData = new FormData();
  formData.append("unitId", unit.id);
  formData.append("fileName", `${unit.title} - Official Verified Notes.pdf`);
  formData.append("directUrl", "https://pcvvdcbivqzqrwrwowlp.supabase.co/storage/v1/object/public/notes-pdfs/sample-notes.pdf");

  const res = await fetch("http://localhost:3000/api/v1/admin/upload-pdf", {
    method: "POST",
    headers: {
      "x-admin-passcode": "admin123",
    },
    body: formData,
  });

  const json = await res.json();
  console.log("Upload API response status:", res.status);
  console.log("Upload API response body:", json);

  if (res.status === 200 && json.success) {
    console.log("🎉 PDF UPLOAD SUITE IS FULLY OPERATIONAL!");
  } else {
    console.error("❌ Upload test failed!");
  }
}

testUploadFlow();
