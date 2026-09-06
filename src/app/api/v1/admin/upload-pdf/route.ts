import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

import { verifyMasterAdminPassword } from "@/lib/admin-auth";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function isAuthorized(req: Request): Promise<boolean> {
  const url = new URL(req.url);
  const raw = req.headers.get("x-admin-passcode") || url.searchParams.get("passcode") || "";
  const passcode = raw.trim();
  if (!passcode) return false;
  return await verifyMasterAdminPassword(passcode);
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorized(req))) {
      const authError = await requireRole("admin");
      if (authError) return authError;
    }
    const formData = await req.formData();
    const unitId = formData.get("unitId") as string;
    const file = formData.get("file") as File | null;
    const directUrl = formData.get("directUrl") as string | null;
    const customName = formData.get("fileName") as string | null;

    if (!unitId) {
      return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    }

    // Verify unit exists
    const { data: unit, error: unitErr } = await supabaseAdmin
      .from("units")
      .select("id, title, slug, subject_id, subjects(name, slug, semesters(name, slug, courses(code)))")
      .eq("id", unitId)
      .single();

    if (unitErr || !unit) {
      return NextResponse.json({ error: "Unit not found in curriculum database" }, { status: 404 });
    }

    let fileUrl = directUrl?.trim() || "";
    let fileName = customName?.trim() || "";
    let fileSizeKb = 0;

    // Handle file upload to Supabase Storage bucket `notes-pdfs`
    if (file && file.size > 0) {
      // Validate file extension and MIME type
      const isPdfName = file.name.toLowerCase().endsWith(".pdf");
      const isPdfMime = file.type === "application/pdf" || file.type === "" || file.type === "application/octet-stream";
      if (!isPdfName) {
        return NextResponse.json(
          { error: "Invalid file type: Only PDF documents (.pdf) are permitted." },
          { status: 400 }
        );
      }

      // 50MB maximum size limit
      const MAX_BYTES = 50 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum limit is 50MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileSizeKb = Math.round(file.size / 1024);
      fileName = fileName || file.name;

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `units/${unitId}/${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
        .from("notes-pdfs")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        return NextResponse.json({ error: `Supabase Storage upload failed: ${uploadErr.message}` }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("notes-pdfs")
        .getPublicUrl(storagePath);

      fileUrl = publicUrlData.publicUrl;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "Either a PDF file or a direct URL must be provided" }, { status: 400 });
    }

    fileName = fileName || `${unit.title} Notes.pdf`;

    // Check if download record already exists for this unit
    const { data: existing } = await supabaseAdmin
      .from("downloads")
      .select("id")
      .eq("unit_id", unitId)
      .maybeSingle();

    let downloadRecord;
    if (existing) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("downloads")
        .update({
          file_name: fileName,
          file_url: fileUrl,
          file_size_kb: fileSizeKb || undefined,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      downloadRecord = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("downloads")
        .insert({
          unit_id: unitId,
          file_name: fileName,
          file_url: fileUrl,
          file_size_kb: fileSizeKb,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      downloadRecord = inserted;
    }

    // Build public page URL
    const subjectObj: any = unit.subjects;
    const rawCourseCode = subjectObj?.semesters?.courses?.code?.toLowerCase() || "bpharm";
    const courseCode = rawCourseCode.replace("-", ""); // Ensure 'bpharm' or 'dpharm'
    const semSlug = subjectObj?.semesters?.slug || "1st-semester";
    const subSlug = subjectObj?.slug || "subject";
    const publicPageUrl = `/${courseCode}/${semSlug}/${subSlug}/${unit.slug}`;

    return NextResponse.json({
      success: true,
      message: `PDF successfully saved for ${unit.title}`,
      download: downloadRecord,
      publicPageUrl,
      fileUrl,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
