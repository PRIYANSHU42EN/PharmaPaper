import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    // Fetch video's lecturer_id to identify lecturer comments
    const { data: video } = await supabase
      .from("videos")
      .select("lecturer_id")
      .eq("id", videoId)
      .maybeSingle();

    const lecturerId = video?.lecturer_id;

    // Fetch top-level comments first (where parent_id is null)
    const { data: topComments, error: topError, count } = await supabase
      .from("video_comments")
      .select("*", { count: "exact" })
      .eq("video_id", videoId)
      .is("parent_id", null)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (topError) {
      console.error("Fetch comments error:", topError);
      return NextResponse.json({ error: topError.message }, { status: 500 });
    }

    if (!topComments || topComments.length === 0) {
      return NextResponse.json({ comments: [], totalCount: 0 });
    }

    // Fetch replies for these comments
    const commentIds = topComments.map((c) => c.id);
    const { data: replies, error: replyError } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .in("parent_id", commentIds)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (replyError) {
      console.error("Fetch replies error:", replyError);
    }

    // Group replies by parent_id
    const repliesMap: Record<string, any[]> = {};
    (replies || []).forEach((reply) => {
      const parentId = reply.parent_id;
      if (!repliesMap[parentId]) {
        repliesMap[parentId] = [];
      }
      // Flag lecturer
      const isLecturer = lecturerId && reply.user_id === lecturerId;
      repliesMap[parentId].push({ ...reply, isLecturer });
    });

    // Map top comments and attach replies
    const formattedComments = topComments.map((comment) => {
      const isLecturer = lecturerId && comment.user_id === lecturerId;
      return {
        ...comment,
        isLecturer,
        replies: repliesMap[comment.id] || [],
      };
    });

    return NextResponse.json({
      comments: formattedComments,
      totalCount: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error: any) {
    console.error("GET comments route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
