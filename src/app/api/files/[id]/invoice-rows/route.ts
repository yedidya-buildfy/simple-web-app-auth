import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    // Verify file ownership
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First get invoices for this file
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id")
      .eq("file_id", id);

    if (invError) {
      console.error("Invoices fetch error:", invError);
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ invoiceRows: [] });
    }

    const invoiceIds = invoices.map((inv) => inv.id);

    // Fetch invoice rows with invoice details
    const { data: invoiceRows, error: rowsError } = await supabase
      .from("invoice_rows")
      .select(`
        id,
        description,
        quantity,
        unit_price,
        total,
        invoice:invoices(vendor_name, document_number)
      `)
      .in("invoice_id", invoiceIds);

    if (rowsError) {
      console.error("Invoice rows fetch error:", rowsError);
      return NextResponse.json(
        { error: "Failed to fetch invoice rows" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoiceRows: invoiceRows || [] });
  } catch (error) {
    console.error("Invoice rows endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
