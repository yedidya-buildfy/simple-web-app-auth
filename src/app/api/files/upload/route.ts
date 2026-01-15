import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sourceType = formData.get("source_type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sourceType || !["bank", "credit_card", "invoice"].includes(sourceType)) {
      return NextResponse.json(
        { error: "Invalid source_type. Must be: bank, credit_card, or invoice" },
        { status: 400 }
      );
    }

    // Determine file type from extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileTypeMap: Record<string, string> = {
      csv: "csv",
      xlsx: "excel",
      xls: "excel",
      pdf: "pdf",
      png: "image",
      jpg: "image",
      jpeg: "image",
      webp: "image",
    };
    const fileType = fileTypeMap[extension];

    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file type: .${extension}` },
        { status: 400 }
      );
    }

    // Create storage path: {user_id}/{source_type}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${user.id}/${sourceType}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Create record in files table
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        user_id: user.id,
        filename: file.name,
        file_type: fileType,
        source_type: sourceType,
        storage_path: storagePath,
        file_size: file.size,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete the uploaded file if DB insert fails
      await supabase.storage.from("files").remove([storagePath]);
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
