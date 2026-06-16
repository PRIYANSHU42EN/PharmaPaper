import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authError = await requireRole("admin");
    if (authError) return authError;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch user details + profile + payments + audit logs
    const [userRes, paymentsRes, logsRes] = await Promise.all([
      supabase.from("users").select("*, profiles(*)").eq("id", id).single(),
      supabase.from("payments").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*").eq("record_id", id).order("created_at", { ascending: false }).limit(20)
    ]);

    if (userRes.error || !userRes.data) {
      return apiError(404, "User not found");
    }

    return success({
      user: userRes.data,
      payments: paymentsRes.data || [],
      logs: logsRes.data || []
    });

  } catch (err) {
    console.error("Error fetching user details:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authError = await requireRole("admin");
    if (authError) return authError;

    const body = await req.json();
    const { role } = body; // Can also handle suspension status if added to DB schema

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: any = {};
    if (role) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No fields to update");
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return apiError(500, "Failed to update user");
    }

    // Log the action
    await supabase.from("admin_activity_logs").insert({
      admin_id: "admin", // Ideally from auth()
      action: "UPDATE_USER",
      details: { target_user: id, updates }
    });

    return success({ message: "User updated successfully" });

  } catch (err) {
    console.error("Error updating user:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authError = await requireRole("admin");
    if (authError) return authError;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Soft delete via profiles table as established in Phase 1 profile implementation
    const { error: deleteError } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", id);

    if (deleteError) {
      return apiError(500, "Failed to delete user");
    }

    await supabase.from("admin_activity_logs").insert({
      admin_id: "admin",
      action: "DELETE_USER",
      details: { target_user: id }
    });

    return success({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Error deleting user:", err);
    return apiError(500, "Internal Server Error");
  }
}
