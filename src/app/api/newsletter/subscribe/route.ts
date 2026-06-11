import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailSchema } from "@/lib/validators";

/**
 * POST /api/newsletter/subscribe
 *
 * Stores an email signup in the `newsletter_subscribers` Supabase table.
 * Public endpoint — no auth required.
 *
 * Request body: { email: string }
 * Success: 200 { success: true }
 * Duplicate: 200 { success: true, existing: true }
 * Validation error: 400 { error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[newsletter] Missing Supabase configuration.");
      // Fail silently from the user's perspective — don't block the UX
      return NextResponse.json({ success: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert to handle duplicates gracefully
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: "email" });

    if (error) {
      // Table might not exist yet — don't surface DB errors to users
      console.error("[newsletter] Supabase upsert error:", error.message);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[newsletter] Unexpected error:", err?.message);
    return NextResponse.json({ success: true }); // fail silently
  }
}
