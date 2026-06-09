import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const course = searchParams.get("course");

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const query = supabase
      .from("study_materials")
      .select("id, title, file_url, created_at, semester, course, subject")
      .eq("type", "pyq")
      .eq("subject", subject);

    if (course) {
      query.eq("course", course);
    }

    const { data: pyqs, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch related PYQs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pyqs: pyqs || [] });
  } catch (error: any) {
    console.error("GET related PYQs route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
