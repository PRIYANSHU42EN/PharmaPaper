import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
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
      .select("id, title, slug, subject_id, subjects(name, semesters(name, courses(code)))")
      .eq("id", unitId)
      .single();

    if (unitErr || !unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    let fileUrl = directUrl?.trim() || "";
    let fileName = customName?.trim() || "";
    let fileSizeKb = 0;

    // Handle file upload to Supabase Storage bucket `notes-pdfs`
    if (file && file.size > 0) {
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
        return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      message: `PDF successfully saved for ${unit.title}`,
      download: downloadRecord,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
