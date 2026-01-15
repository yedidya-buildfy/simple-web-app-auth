import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get("filename");
    const size = searchParams.get("size");
    const sourceType = searchParams.get("source_type");

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    // Check for existing file with same name and size
    let query = supabase
      .from("files")
      .select("id, filename, file_size, source_type, created_at, storage_path")
      .eq("user_id", user.id)
      .eq("filename", filename);

    if (size) {
      query = query.eq("file_size", parseInt(size));
    }

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const { data: existingFiles, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingFiles && existingFiles.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        existingFile: existingFiles[0],
      });
    }

    return NextResponse.json({
      isDuplicate: false,
      existingFile: null,
    });
  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
