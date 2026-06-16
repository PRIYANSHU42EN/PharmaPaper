import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: videos, count, error: dbError } = await supabase
      .from("videos")
      .select("*, lecturer:lecturers(name, avatar_url)", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: status === "pending" }) // Oldest first for pending queue
      .range(offset, offset + limit - 1);

    if (dbError) {
      console.error("Error fetching videos:", dbError);
      return apiError(500, "Database error");
    }

    return success({
      videos,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (err) {
    console.error("Error in GET /admin/videos:", err);
    return apiError(500, "Internal Server Error");
  }
}
