import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";
import { revalidateUnitHierarchy, revalidateSubjectHierarchy, revalidatePost } from "@/lib/revalidate";

import { verifyMasterAdminPassword } from "@/lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader && process.env.SUPABASE_SERVICE_ROLE_KEY && authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return true;
  }
  const raw = req.headers.get("x-admin-passcode") || req.nextUrl.searchParams.get("passcode") || "";
  const passcode = raw.trim();
  if (!passcode) return false;
  return await verifyMasterAdminPassword(passcode);
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      const authError = await requireRole("admin");
      if (authError) return authError;
    }

    const body = await req.json();
    const { action } = body;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    if (action === "rename-subject") {
      const { id, name } = body;
      if (!id || !name?.trim()) {
        return apiError(400, "Subject ID and name are required");
      }
      const { data, error } = await supabase
        .from("subjects")
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();

      if (error) return apiError(500, error.message);
      await revalidateSubjectHierarchy(supabase, id);
      return success({ subject: data });
    }

    if (action === "rename-unit") {
      const { id, title } = body;
      if (!id || !title?.trim()) {
        return apiError(400, "Unit ID and title are required");
      }
      const { data, error } = await supabase
        .from("units")
        .update({ title: title.trim() })
        .eq("id", id)
        .select()
        .single();

      if (error) return apiError(500, error.message);
      await revalidateUnitHierarchy(supabase, id);
      return success({ unit: data });
    }

    if (action === "create-post") {
      const { title, slug, excerpt, content_html, category } = body;
      if (!title?.trim() || !slug?.trim()) {
        return apiError(400, "Title and slug are required");
      }
      const finalSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: title.trim(),
          slug: finalSlug,
          excerpt: excerpt?.trim() || "",
          content_html: content_html?.trim() || "",
          category: category?.trim() || "Career",
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return apiError(500, error.message);
      revalidatePost(finalSlug);
      return success({ post: data });
    }

    if (action === "update-post") {
      const { id, title, slug, excerpt, content_html, category } = body;
      if (!id || !title?.trim()) {
        return apiError(400, "Post ID and title are required");
      }
      const updatePayload: any = {
        title: title.trim(),
        excerpt: excerpt?.trim() || "",
        content_html: content_html?.trim() || "",
        category: category?.trim() || "Career",
      };
      if (slug?.trim()) {
        updatePayload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }

      const { data, error } = await supabase
        .from("posts")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) return apiError(500, error.message);
      revalidatePost(data.slug);
      return success({ post: data });
    }

    if (action === "delete-post") {
      const { id } = body;
      if (!id) return apiError(400, "Post ID is required");
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) return apiError(500, error.message);
      revalidatePost();
      return success({ deleted: true });
    }

    if (action === "create-subject") {
      const { name, slug, semester_id, order_index } = body;
      if (!name?.trim() || !semester_id) return apiError(400, "Name and semester_id are required");
      const generatedSlug = slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          name: name.trim(),
          slug: generatedSlug,
          semester_id,
          order_index: order_index || 0,
        })
        .select()
        .single();
      if (error) return apiError(500, error.message);
      if (data?.id) {
        await revalidateSubjectHierarchy(supabase, data.id);
      }
      return success({ subject: data });
    }

    if (action === "delete-subject") {
      const { id } = body;
      if (!id) return apiError(400, "Subject ID is required");
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) return apiError(500, error.message);
      revalidatePost(); // also refreshes sitemap and home
      return success({ deleted: true });
    }

    if (action === "create-unit") {
      const { title, slug, subject_id, unit_number } = body;
      if (!title?.trim() || !subject_id) return apiError(400, "Title and subject_id are required");
      const generatedSlug = slug?.trim() || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabase
        .from("units")
        .insert({
          title: title.trim(),
          slug: generatedSlug,
          subject_id,
          unit_number: unit_number || 1,
        })
        .select()
        .single();
      if (error) return apiError(500, error.message);
      if (data?.id) {
        await revalidateUnitHierarchy(supabase, data.id);
      }
      return success({ unit: data });
    }

    if (action === "delete-unit") {
      const { id } = body;
      if (!id) return apiError(400, "Unit ID is required");
      const { error } = await supabase.from("units").delete().eq("id", id);
      if (error) return apiError(500, error.message);
      revalidatePost(); // also refreshes sitemap and home
      return success({ deleted: true });
    }

    if (action === "delete-download" || action === "remove-pdf") {
      const { downloadId, unitId } = body;
      if (!downloadId && !unitId) return apiError(400, "downloadId or unitId is required");

      let resolvedUnitId = unitId;
      if (!resolvedUnitId && downloadId) {
        const { data: dl } = await supabase.from("downloads").select("unit_id").eq("id", downloadId).single();
        resolvedUnitId = dl?.unit_id;
      }

      let query = supabase.from("downloads").delete();
      if (downloadId) {
        query = query.eq("id", downloadId);
      } else if (unitId) {
        query = query.eq("unit_id", unitId);
      }
      const { error } = await query;
      if (error) return apiError(500, error.message);

      if (resolvedUnitId) {
        await revalidateUnitHierarchy(supabase, resolvedUnitId);
      }
      return success({ deleted: true });
    }

    if (action === "revalidate") {
      const { unitId, subjectId } = body;
      if (unitId) {
        await revalidateUnitHierarchy(supabase, unitId);
      }
      if (subjectId) {
        await revalidateSubjectHierarchy(supabase, subjectId);
      }
      return success({ revalidated: true });
    }

    return apiError(400, "Invalid action");
  } catch (err: any) {
    console.error("Admin content API error:", err);
    return apiError(500, err.message || "Internal server error");
  }
}
