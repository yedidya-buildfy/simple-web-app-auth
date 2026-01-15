import { createClient } from "@/lib/supabase/server";
import { processFile } from "@/lib/processors";
import { NextRequest, NextResponse } from "next/server";

// POST - Process a file (extract data using AI)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify file exists and belongs to user
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, status, user_id")
      .eq("id", id)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already processing
    if (file.status === "pending") {
      return NextResponse.json(
        { error: "File is already being processed" },
        { status: 409 }
      );
    }

    // Process the file
    const result = await processFile(id, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Process endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
