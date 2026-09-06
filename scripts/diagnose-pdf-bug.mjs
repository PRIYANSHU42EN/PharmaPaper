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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log("=========================================");
  console.log("DIAGNOSING PDF STORAGE & DOWNLOAD URLs");
  console.log("=========================================\n");

  // 1. Check storage bucket
  console.log("1. Checking storage bucket 'notes-pdfs'...");
  const { data: buckets, error: bucketErr } = await adminClient.storage.listBuckets();
  if (bucketErr) {
    console.error("Error listing buckets:", bucketErr);
  } else {
    console.log("Existing buckets:", buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
    const targetBucket = buckets.find(b => b.id === "notes-pdfs" || b.name === "notes-pdfs");
    if (targetBucket) {
      console.log(`Bucket 'notes-pdfs' found. isPublic: ${targetBucket.public}`);
    } else {
      console.warn("WARNING: Bucket 'notes-pdfs' NOT found in storage buckets!");
    }
  }

  // 2. List files in notes-pdfs bucket
  console.log("\n2. Checking files in 'notes-pdfs' bucket...");
  const { data: files, error: filesErr } = await adminClient.storage.from("notes-pdfs").list();
  if (filesErr) {
    console.error("Error listing files in notes-pdfs:", filesErr);
  } else {
    console.log("Files at root of notes-pdfs:", files);
  }

  const { data: unitFiles, error: unitFilesErr } = await adminClient.storage.from("notes-pdfs").list("units");
  if (unitFilesErr) {
    console.error("Error listing units/ in notes-pdfs:", unitFilesErr);
  } else {
    console.log("Folders/files in notes-pdfs/units:", unitFiles);
  }

  // 3. Inspect downloads table
  console.log("\n3. Inspecting 'downloads' table rows...");
  const { data: downloads, error: downErr } = await adminClient
    .from("downloads")
    .select("id, unit_id, file_name, file_url, file_size_kb, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(5);

  if (downErr) {
    console.error("Error querying downloads table:", downErr);
  } else {
    console.log(`Found ${downloads.length} recent download records:`);
    for (const d of downloads) {
      console.log(`- ID: ${d.id}`);
      console.log(`  File Name: ${d.file_name}`);
      console.log(`  File URL: ${d.file_url}`);
      console.log(`  Uploaded at: ${d.uploaded_at}`);
      
      // Test fetching this URL directly
      try {
        const res = await fetch(d.file_url, { method: "HEAD" });
        console.log(`  HEAD request status: ${res.status} ${res.statusText}`);
        console.log(`  Content-Type: ${res.headers.get("content-type")}`);
        console.log(`  Content-Length: ${res.headers.get("content-length")}`);
      } catch (fetchErr) {
        console.error(`  FETCH ERROR for ${d.file_url}:`, fetchErr.message);
      }
    }
  }
}

diagnose();
