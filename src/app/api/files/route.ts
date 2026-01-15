"use server";

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
    const sourceType = searchParams.get("source_type");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!sourceType) {
      return NextResponse.json(
        { error: "source_type is required" },
        { status: 400 }
      );
    }

    // Validate sort column
    const validSortColumns = ["filename", "status", "created_at"];
    if (!validSortColumns.includes(sort)) {
      return NextResponse.json(
        { error: "Invalid sort column" },
        { status: 400 }
      );
    }

    // Build query for files
    let query = supabase
      .from("files")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("source_type", sourceType);

    // Date filters
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      // Add 1 day to include the end date fully
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }

    // Cursor pagination
    if (cursor) {
      if (order === "desc") {
        query = query.lt("id", cursor);
      } else {
        query = query.gt("id", cursor);
      }
    }

    // Sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Secondary sort by id for stable pagination
    if (sort !== "id") {
      query = query.order("id", { ascending: order === "asc" });
    }

    // Limit
    query = query.limit(limit);

    const { data: files, error: filesError, count } = await query;

    if (filesError) {
      console.error("Files query error:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    // Get matched counts based on source type
    const filesWithStats = await Promise.all(
      (files || []).map(async (file) => {
        let matchedCount = 0;

        if (sourceType === "bank" || sourceType === "credit_card") {
          // Count transactions that have matching invoice_rows
          const { count } = await supabase
            .from("transactions")
            .select("id, invoice_rows!inner(id)", { count: "exact", head: true })
            .eq("file_id", file.id);
          matchedCount = count || 0;
        } else if (sourceType === "invoice") {
          // Count invoice_rows that have a transaction_id
          const { data: invoices } = await supabase
            .from("invoices")
            .select("id")
            .eq("file_id", file.id);

          if (invoices && invoices.length > 0) {
            const invoiceIds = invoices.map((i) => i.id);
            const { count } = await supabase
              .from("invoice_rows")
              .select("id", { count: "exact", head: true })
              .in("invoice_id", invoiceIds)
              .not("transaction_id", "is", null);
            matchedCount = count || 0;
          }
        }

        return {
          ...file,
          matched_count: matchedCount,
        };
      })
    );

    // Determine next cursor
    const nextCursor =
      files && files.length === limit
        ? files[files.length - 1].id
        : null;

    return NextResponse.json({
      files: filesWithStats,
      nextCursor,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Files list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
