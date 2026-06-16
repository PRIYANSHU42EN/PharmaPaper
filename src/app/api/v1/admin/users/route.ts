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
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("users")
      .select("*, profiles(avatar_url, course, semester)", { count: "exact" });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (roleFilter) {
      query = query.eq("role", roleFilter);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: users, count, error: dbError } = await query;

    if (dbError) {
      console.error("Error fetching users:", dbError);
      return apiError(500, "Database error");
    }

    return success({
      users,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (err) {
    console.error("Error in GET /admin/users:", err);
    return apiError(500, "Internal Server Error");
  }
}
