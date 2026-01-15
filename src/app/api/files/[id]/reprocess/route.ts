import { createClient } from "@/lib/supabase/server";
import { processFile } from "@/lib/processors";
import { NextRequest, NextResponse } from "next/server";

// POST - Trigger file reprocessing (clears existing data and re-processes)
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

    // Get the file record
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("id, user_id, filename, source_type, status")
      .eq("id", id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete existing extracted data (transactions or invoices)
    if (file.source_type === "invoice") {
      // Delete invoice rows first (foreign key), then invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("file_id", id);

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map((inv) => inv.id);
        await supabase.from("invoice_rows").delete().in("invoice_id", invoiceIds);
        await supabase.from("invoices").delete().eq("file_id", id);
      }
    } else {
      // Delete transactions
      await supabase.from("transactions").delete().eq("file_id", id);
    }

    // Reset file status
    await supabase
      .from("files")
      .update({
        status: "uploaded",
        error_message: null,
        processed_at: null,
        items_count: 0,
        confidence_score: null,
        detected_type: null,
      })
      .eq("id", id);

    // Process the file
    const result = await processFile(id, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reprocess error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
