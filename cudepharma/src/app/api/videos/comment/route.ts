import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Basic profanity check
const PROFANITY_WORDS = ["fuck", "shit", "bitch", "asshole", "bastard", "crap", "spam", "abuse"];

function hasProfanity(text: string): boolean {
  const normalized = text.toLowerCase();
  return PROFANITY_WORDS.some((word) => normalized.includes(word));
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit check (5 per minute per user)
    const { blocked, headers } = await checkRateLimit("comment", userId);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many comments. Please wait a minute." },
        { status: 429, headers }
      );
    }

    const body = await req.json();
    const { videoId, content, parentId } = body;

    // Validation
    if (!videoId || !content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Comment too long (max 500 characters)" }, { status: 400 });
    }

    // Check for HTML tags
    const htmlRegex = /<[^>]*>/g;
    if (htmlRegex.test(content)) {
      return NextResponse.json({ error: "HTML tags are not allowed" }, { status: 400 });
    }

    // Fetch user details from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Student";
    const avatarUrl = clerkUser.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

    // Simple profanity filter moderation
    const isApproved = !hasProfanity(content);

    // Save to database
    const { data: newComment, error: dbError } = await supabase
      .from("video_comments")
      .insert({
        video_id: videoId,
        user_id: userId,
        user_name: fullName,
        user_avatar: avatarUrl,
        content,
        parent_id: parentId || null,
        is_approved: isApproved,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Comment db error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
      moderated: !isApproved,
    });
  } catch (error: any) {
    console.error("Comment POST route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
