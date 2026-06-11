import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: fetchLecturer, error } = await supabase
      .from("lecturers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let lecturer = fetchLecturer;

    if (error) {
      console.error("Fetch lecturer error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-create database row if user has Clerk metadata role 'lecturer' or is admin
    if (!lecturer) {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const role = (user.publicMetadata as any)?.role;

      if (role === "lecturer" || role === "admin") {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Lecturer";
        const avatarUrl = user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

        const { data: newLecturer, error: insertError } = await supabase
          .from("lecturers")
          .insert({
            user_id: userId,
            name: name,
            avatar_url: avatarUrl,
            bio: "",
            specialization: "",
            social_links: {},
          })
          .select()
          .single();

        if (insertError) {
          console.error("Auto-insert lecturer error:", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        lecturer = newLecturer;
      } else {
        return NextResponse.json({ error: "Not a registered lecturer" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, lecturer });
  } catch (error: any) {
    console.error("Lecturer profile GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, specialization, avatarUrl, bannerUrl, socialLinks } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: lecturer, error: updateError } = await supabase
      .from("lecturers")
      .update({
        name,
        bio: bio || "",
        specialization: specialization || "",
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        social_links: socialLinks || {},
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Update lecturer profile error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lecturer });
  } catch (error: any) {
    console.error("Lecturer profile POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
