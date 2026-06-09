import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // Fetch playlists
    const { data: playlists, error: playlistsError } = await supabase
      .from("playlists")
      .select("*")
      .eq("lecturer_id", lecturer.id)
      .order("created_at", { ascending: false });

    if (playlistsError) {
      console.error("Fetch playlists error:", playlistsError);
      return NextResponse.json({ error: playlistsError.message }, { status: 500 });
    }

    // For each playlist, fetch its videos
    const playlistsWithVideos = await Promise.all(
      (playlists || []).map(async (playlist) => {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, title, youtube_id, is_premium, playlist_order, status, created_at")
          .eq("playlist_id", playlist.id)
          .order("playlist_order", { ascending: true });
        return {
          ...playlist,
          videos: videos || [],
        };
      })
    );

    return NextResponse.json({ success: true, playlists: playlistsWithVideos });
  } catch (error: any) {
    console.error("Playlists GET error:", error);
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
    const { action, playlistId, videoIds, title, description, course, semester, subject, isPublished, thumbnailUrl } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // ACTION: Reorder videos in a playlist
    if (action === "reorder") {
      if (!playlistId || !Array.isArray(videoIds)) {
        return NextResponse.json({ error: "Missing reorder parameters" }, { status: 400 });
      }

      // Update order of each video in series
      for (let index = 0; index < videoIds.length; index++) {
        const videoId = videoIds[index];
        await supabase
          .from("videos")
          .update({ playlist_order: index })
          .eq("id", videoId)
          .eq("lecturer_id", lecturer.id);
      }

      return NextResponse.json({ success: true, message: "Playlist order updated" });
    }

    // ACTION: Add videos to playlist
    if (action === "add-videos") {
      if (!playlistId || !Array.isArray(videoIds)) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      // Update the playlist_id of all selected videos
      const { error: updateError } = await supabase
        .from("videos")
        .update({ playlist_id: playlistId })
        .in("id", videoIds)
        .eq("lecturer_id", lecturer.id);

      if (updateError) {
        console.error("Add videos to playlist error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // DEFAULT ACTION: Create playlist
    if (!title || !course || !semester || !subject) {
      return NextResponse.json({ error: "Missing required fields for playlist creation" }, { status: 400 });
    }

    const { data: newPlaylist, error: insertError } = await supabase
      .from("playlists")
      .insert({
        title,
        description: description || "",
        course,
        semester: parseInt(semester, 10) || 1,
        subject,
        lecturer_id: lecturer.id,
        thumbnail_url: thumbnailUrl || "",
        is_published: !!isPublished,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert playlist error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, playlist: newPlaylist });
  } catch (error: any) {
    console.error("Playlists POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, description, course, semester, subject, isPublished, thumbnailUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (course) updateData.course = course;
    if (semester !== undefined) updateData.semester = parseInt(semester, 10);
    if (subject) updateData.subject = subject;
    if (isPublished !== undefined) updateData.is_published = !!isPublished;
    if (thumbnailUrl !== undefined) updateData.thumbnail_url = thumbnailUrl;

    const { data: updatedPlaylist, error: updateError } = await supabase
      .from("playlists")
      .update(updateData)
      .eq("id", id)
      .eq("lecturer_id", lecturer.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update playlist error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sync is_published status from playlist to all approved/published videos under this playlist if required
    if (isPublished !== undefined) {
      await supabase
        .from("videos")
        .update({ is_published: isPublished })
        .eq("playlist_id", id)
        .eq("status", "approved");
    }

    return NextResponse.json({ success: true, playlist: updatedPlaylist });
  } catch (error: any) {
    console.error("Playlists PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // Set playlist_id = 'default_playlist' on all videos of this playlist before deleting
    await supabase
      .from("videos")
      .update({ playlist_id: "default_playlist" })
      .eq("playlist_id", id)
      .eq("lecturer_id", lecturer.id);

    // Delete playlist
    const { error: deleteError } = await supabase
      .from("playlists")
      .delete()
      .eq("id", id)
      .eq("lecturer_id", lecturer.id);

    if (deleteError) {
      console.error("Delete playlist error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Playlists DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
