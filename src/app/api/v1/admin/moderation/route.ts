import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

import { verifyMasterAdminPassword } from "@/lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const raw = req.headers.get("x-admin-passcode") || req.nextUrl.searchParams.get("passcode") || "";
  const passcode = raw.trim();
  if (!passcode) return false;
  return await verifyMasterAdminPassword(passcode);
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      const authError = await requireRole("admin");
      if (authError) return authError;
    }

    const searchParams = req.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "pending"; // pending or approved
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch comments based on tab: 'pending' (approved = false) vs 'approved' (approved = true)
    const isApproved = tab === "approved";
    const { data: comments, error: dbError } = await supabase
      .from("comments")
      .select("*")
      .eq("approved", isApproved)
      .order("created_at", { ascending: false })
      .limit(100);

    if (dbError) {
      console.error("DB error fetching comments:", dbError);
      return success({ comments: [] });
    }

    return success({ comments: comments || [] });

  } catch (err) {
    console.error("Error in GET /admin/moderation:", err);
    return success({ comments: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      const authError = await requireRole("admin");
      if (authError) return authError;
    }

    const body = await req.json();
    const { id, action } = body; // action = approve, delete

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "approve") {
      await supabase.from("comments").update({ approved: true }).eq("id", id);
    } else if (action === "delete") {
      await supabase.from("comments").delete().eq("id", id);
    }

    return success({ message: "Action successful" });

  } catch (err) {
    console.error("Error in PATCH /admin/moderation:", err);
    return apiError(500, "Internal Server Error");
  }
}
