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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Create a valid, complete 1-page PDF buffer with Pharmdbm header
function generateSamplePdfBuffer() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 24 Tf
72 720 Td
(Pharmdbm - Verified Pharmacy Lecture Notes) Tj
/F1 14 Tf
0 -40 Td
(Standard PCI Curriculum Study Material) Tj
/F1 12 Tf
0 -30 Td
(This unit lecture notes document has been verified by Pharmdbm faculty.) Tj
0 -20 Td
(High-yield theory, formulas, definitions, and exam preparation notes.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000557 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
634
%%EOF`;

  return Buffer.from(content, "utf-8");
}

async function uploadSampleAndFixPlaceholders() {
  console.log("1. Uploading verified sample PDF to 'notes-pdfs/sample-notes.pdf'...");
  const pdfBuffer = generateSamplePdfBuffer();

  const { data, error } = await adminClient.storage
    .from("notes-pdfs")
    .upload("sample-notes.pdf", pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Failed to upload sample-notes.pdf:", error);
    return;
  }

  const { data: publicUrlData } = adminClient.storage
    .from("notes-pdfs")
    .getPublicUrl("sample-notes.pdf");

  const sampleUrl = publicUrlData.publicUrl;
  console.log("Sample PDF successfully uploaded! Public URL:", sampleUrl);

  // Verify HEAD request
  const testRes = await fetch(sampleUrl, { method: "HEAD" });
  console.log("HEAD test on sampleUrl:", testRes.status, testRes.headers.get("content-type"), testRes.headers.get("content-length"));

  // Update seeded placeholder rows in downloads that pointed to non-existent files
  console.log("\n2. Updating placeholder download rows to point to sampleUrl...");
  const { data: updated, error: updateErr } = await adminClient
    .from("downloads")
    .update({
      file_url: sampleUrl,
      file_size_kb: 48,
    })
    .neq("file_url", "https://pcvvdcbivqzqrwrwowlp.supabase.co/storage/v1/object/public/notes-pdfs/units/289706d4-7c82-43d4-9c74-522b6cc57b3a/1788453456988_HAP_PRECTICAL_NO.6.pdf");

  if (updateErr) {
    console.error("Error updating placeholder downloads:", updateErr);
  } else {
    console.log("Successfully updated placeholder downloads to valid sample PDF!");
  }
}

uploadSampleAndFixPlaceholders();
