import { createClient } from "@/lib/supabase/server";
import { parseFile } from "./parsers";
import { extractData } from "./extractors";
import {
  SourceType,
  ProcessingResult,
  DuplicateTransaction,
  ExtractedTransaction,
  BankExtractionResult,
  CreditCardExtractionResult,
  InvoiceExtractionResult,
} from "./types";
import crypto from "crypto";

export * from "./types";

/**
 * Generate hash for duplicate detection
 */
function generateTransactionHash(tx: ExtractedTransaction): string {
  const data = `${tx.date}|${tx.amount}|${tx.description}`;
  return crypto.createHash("md5").update(data).digest("hex");
}

/**
 * Process a file: parse, extract, and save to database
 */
export async function processFile(
  fileId: string,
  userId: string
): Promise<ProcessingResult> {
  const supabase = await createClient();

  console.log(`[PROCESS] Starting processing for file: ${fileId}`);

  try {
    // 1. Get file record
    console.log("[PROCESS] Step 1: Getting file record...");
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", userId)
      .single();

    if (fileError || !file) {
      console.error("[PROCESS] File not found:", fileError);
      throw new Error("File not found");
    }

    console.log(`[PROCESS] File found: ${file.filename}, type: ${file.file_type}, source: ${file.source_type}`);

    // 2. Update status to pending (processing)
    console.log("[PROCESS] Step 2: Updating status to pending...");
    await supabase
      .from("files")
      .update({ status: "pending" })
      .eq("id", fileId);

    // 3. Download file from storage
    console.log(`[PROCESS] Step 3: Downloading file from storage: ${file.storage_path}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("files")
      .download(file.storage_path);

    if (downloadError || !fileData) {
      console.error("[PROCESS] Download failed:", downloadError);
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log(`[PROCESS] File downloaded, size: ${fileData.size} bytes`);

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log(`[PROCESS] Buffer created, length: ${buffer.length}`);

    // 4. Parse file
    console.log(`[PROCESS] Step 4: Parsing file (type: ${file.file_type})...`);
    const parsedFile = await parseFile(buffer, file.filename, file.file_type);
    console.log(`[PROCESS] File parsed:`, {
      fileType: parsedFile.fileType,
      hasRows: !!parsedFile.rows,
      rowCount: parsedFile.rows?.length || 0,
      hasText: !!parsedFile.text,
      textLength: parsedFile.text?.length || 0,
      hasImages: !!parsedFile.images,
      imageCount: parsedFile.images?.length || 0,
    });

    // 5. Extract data based on source type
    const sourceType = file.source_type as SourceType;
    console.log(`[PROCESS] Step 5: Extracting data for source type: ${sourceType}...`);
    const extraction = await extractData(parsedFile, sourceType);
    console.log(`[PROCESS] Extraction complete:`, {
      confidence: extraction.confidence,
      isCorrectDocType: extraction.isCorrectDocType,
      detectedDocType: extraction.detectedDocType,
      warnings: extraction.warnings,
    });

    // 6. Check if correct document type
    if (!extraction.isCorrectDocType) {
      await supabase
        .from("files")
        .update({
          status: "failed",
          error_message: `Document appears to be: ${extraction.detectedDocType || "unknown"}. Expected: ${sourceType}`,
          confidence_score: extraction.confidence,
          detected_type: extraction.detectedDocType,
        })
        .eq("id", fileId);

      return {
        success: false,
        fileId,
        status: "failed",
        confidence: extraction.confidence,
        isCorrectDocType: false,
        detectedDocType: extraction.detectedDocType,
        itemsCount: 0,
        duplicatesFound: [],
        creditCardPaymentsFound: [],
        error: `Document type mismatch. Detected: ${extraction.detectedDocType}`,
        warnings: extraction.warnings,
      };
    }

    // 7. Save extracted data to database
    let itemsCount = 0;
    let duplicatesFound: DuplicateTransaction[] = [];
    let creditCardPaymentsFound: BankExtractionResult["creditCardPayments"] = [];

    if (sourceType === "bank" || sourceType === "credit_card") {
      const bankOrCcResult = extraction as
        | BankExtractionResult
        | CreditCardExtractionResult;

      // Check for duplicates
      const transactions = bankOrCcResult.transactions;
      const hashes = transactions.map((tx) => generateTransactionHash(tx));

      // Find existing transactions with same hashes
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id, date, description, amount, hash, file_id, files(filename)")
        .eq("user_id", userId)
        .in("hash", hashes);

      const existingHashes = new Set(
        existingTx?.map((tx) => tx.hash) || []
      );

      // Separate duplicates and new transactions
      const newTransactions: ExtractedTransaction[] = [];
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const hash = hashes[i];

        if (existingHashes.has(hash)) {
          const existing = existingTx?.find((e) => e.hash === hash);
          if (existing) {
            duplicatesFound.push({
              newTransaction: tx,
              existingTransaction: {
                id: existing.id,
                date: existing.date,
                description: existing.description,
                amount: existing.amount,
                fileId: existing.file_id,
                fileName: (existing.files as unknown as { filename: string } | null)?.filename || "Unknown",
              },
              hash,
            });
          }
        } else {
          newTransactions.push(tx);
        }
      }

      // Insert new transactions
      if (newTransactions.length > 0) {
        const transactionsToInsert = newTransactions.map((tx, index) => ({
          user_id: userId,
          file_id: fileId,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          direction: tx.direction,
          reference: tx.reference || null,
          currency: tx.originalCurrency || "ILS",
          source: sourceType,
          hash: hashes[transactions.indexOf(tx)],
        }));

        const { error: insertError } = await supabase
          .from("transactions")
          .insert(transactionsToInsert);

        if (insertError) {
          console.error("Transaction insert error:", insertError);
        }

        itemsCount = newTransactions.length;
      }

      // Get credit card payments for bank statements
      if (sourceType === "bank") {
        creditCardPaymentsFound =
          (extraction as BankExtractionResult).creditCardPayments || [];
      }

      // Update file with statement period
      const period = bankOrCcResult.statementPeriod;
      await supabase
        .from("files")
        .update({
          statement_period_start: period?.startDate || null,
          statement_period_end: period?.endDate || null,
          statement_total: period?.statementTotal || null,
        })
        .eq("id", fileId);

    } else if (sourceType === "invoice") {
      const invoiceResult = extraction as InvoiceExtractionResult;

      // Insert invoices and their rows
      for (const invoice of invoiceResult.invoices) {
        const { data: insertedInvoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            user_id: userId,
            file_id: fileId,
            vendor_name: invoice.vendorName,
            document_type: invoice.documentType,
            document_number: invoice.documentNumber,
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            currency: invoice.currency || "ILS",
            extracted_subtotal: invoice.subtotal,
            vat_rate: invoice.vatRate,
            extracted_vat: invoice.vatAmount,
            extracted_total: invoice.total,
            stated_total: invoice.total,
            confidence_score: extraction.confidence,
            is_consolidated: invoiceResult.invoices.length > 1,
            status: "extracted",
          })
          .select()
          .single();

        if (invoiceError || !insertedInvoice) {
          console.error("Invoice insert error:", invoiceError);
          continue;
        }

        // Insert invoice rows
        if (invoice.rows.length > 0) {
          const rowsToInsert = invoice.rows.map((row) => ({
            invoice_id: insertedInvoice.id,
            description: row.description,
            quantity: row.quantity || 1,
            unit_price: row.unitPrice,
            total: row.total,
          }));

          const { error: rowsError } = await supabase
            .from("invoice_rows")
            .insert(rowsToInsert);

          if (rowsError) {
            console.error("Invoice rows insert error:", rowsError);
          }

          itemsCount += invoice.rows.length;
        }
      }
    }

    // 8. Update file status to processed
    await supabase
      .from("files")
      .update({
        status: "processed",
        confidence_score: extraction.confidence,
        items_count: itemsCount,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", fileId);

    return {
      success: true,
      fileId,
      status: "processed",
      confidence: extraction.confidence,
      isCorrectDocType: true,
      itemsCount,
      duplicatesFound,
      creditCardPaymentsFound,
      statementPeriod:
        sourceType !== "invoice"
          ? (extraction as BankExtractionResult | CreditCardExtractionResult)
              .statementPeriod
          : undefined,
      warnings: extraction.warnings,
    };
  } catch (error) {
    console.error("Processing error:", error);

    // Update file status to failed
    await supabase
      .from("files")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Processing failed",
      })
      .eq("id", fileId);

    return {
      success: false,
      fileId,
      status: "failed",
      confidence: 0,
      isCorrectDocType: false,
      itemsCount: 0,
      duplicatesFound: [],
      creditCardPaymentsFound: [],
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
}
