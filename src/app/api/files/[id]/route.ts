import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH - Rename file
export async function PATCH(
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

    // Get request body
    const body = await request.json();
    const { filename } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update filename
    const { data: updatedFile, error: updateError } = await supabase
      .from("files")
      .update({ filename: filename.trim() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to rename file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (error) {
    console.error("Rename error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete file with cascade
export async function DELETE(
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

    // Get the file record first (to get storage_path, source_type and verify ownership)
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("id, storage_path, user_id, source_type")
      .eq("id", id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cascade delete based on source type
    if (file.source_type === "bank" || file.source_type === "credit_card") {
      // Get all transactions from this file
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id")
        .eq("file_id", id);

      if (transactions && transactions.length > 0) {
        const transactionIds = transactions.map((t) => t.id);

        // Delete invoice_rows that reference these transactions
        await supabase
          .from("invoice_rows")
          .delete()
          .in("transaction_id", transactionIds);

        // Delete transactions
        await supabase.from("transactions").delete().eq("file_id", id);
      }
    } else if (file.source_type === "invoice") {
      // Get all invoices from this file
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("file_id", id);

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map((i) => i.id);

        // Delete invoice_rows
        await supabase
          .from("invoice_rows")
          .delete()
          .in("invoice_id", invoiceIds);

        // Delete invoices
        await supabase.from("invoices").delete().eq("file_id", id);
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("files")
      .remove([file.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue anyway - file might not exist in storage
    }

    // Delete file record from database
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
