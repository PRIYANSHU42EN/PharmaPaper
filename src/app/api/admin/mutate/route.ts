import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/ratelimit";
import { materialSchema } from "@/lib/validators";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const internalSecret = process.env.INTERNAL_DB_SECRET || "";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { blocked, headers } = await checkRateLimit("admin", ip);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 1 minute." },
        { status: 429, headers }
      );
    }

    const { userId, sessionClaims } = await auth();

    // ✅ Double verify — never trust middleware alone
    if (!userId || (sessionClaims as any)?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { operation, payload } = body;

    if (!operation || !payload) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Verify User Role is Admin or Super-Admin
    const { data: isAdmin, error: roleError } = await supabase.rpc(
      "check_user_admin_by_id",
      {
        p_secret: internalSecret,
        p_user_id: userId,
      }
    );

    if (roleError) {
      console.error("Role check database error in mutate:", roleError);
      return NextResponse.json({ error: "Internal Database Error" }, { status: 500 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Perform the requested operation using SECURITY DEFINER RPCs
    if (operation === "MUTATE_STUDY_MATERIAL") {
      const result = materialSchema.safeParse(payload);
      if (!result.success) {
        return NextResponse.json(
          {
            error: "Invalid input payload",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const {
        action,
        id,
        title,
        semester,
        course,
        file_url,
        type,
        subject,
      } = result.data;

      const { error } = await supabase.rpc("secure_mutate_study_material", {
        p_secret: internalSecret,
        p_action: action,
        p_id: id || null,
        p_title: title || "",
        p_semester: semester || 1,
        p_course: course || "",
        p_file_url: file_url || "",
        p_type: type || "",
        p_subject: subject || "",
      });

      if (error) {
        console.error("mutate_study_material error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (operation === "MUTATE_USER_ROLE") {
      const { id, role } = payload;

      if (!id || !role) {
        return NextResponse.json({ error: "Missing user ID or role" }, { status: 400 });
      }

      const { error } = await supabase.rpc("secure_mutate_user_role", {
        p_secret: internalSecret,
        p_id: id,
        p_role: role,
      });

      if (error) {
        console.error("mutate_user_role error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (operation === "LOG_ACTIVITY") {
      const { action, details } = payload;

      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      const adminEmail = userData?.email || "Unknown Admin";

      const { error } = await supabase.rpc("secure_insert_activity_log", {
        p_secret: internalSecret,
        p_admin_id: adminEmail,
        p_action: action,
        p_details: details || {},
      });

      if (error) {
        console.error("insert_activity_log error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (operation === "SAVE_SETTINGS") {
      const { settings } = payload;

      if (!settings || typeof settings !== "object") {
        return NextResponse.json({ error: "Missing settings object" }, { status: 400 });
      }

      // Persist each setting key-value pair
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.rpc("secure_update_settings", {
          p_secret: internalSecret,
          p_key: key,
          p_value: String(value),
        });

        if (error) {
          console.error(`save_settings error for key '${key}':`, error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Mutation route exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
