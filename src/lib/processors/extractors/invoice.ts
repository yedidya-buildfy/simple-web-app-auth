import { queryGemini } from "../ai/gemini";
import {
  INVOICE_EXTRACTION_PROMPT,
  INVOICE_EXTRACTION_SCHEMA,
} from "../ai/prompts/invoice";
import { ParsedFile, InvoiceExtractionResult } from "../types";

/**
 * Extract invoice/receipt data using AI
 */
export async function extractInvoiceData(
  parsedFile: ParsedFile
): Promise<InvoiceExtractionResult> {
  // Prepare content for AI based on file type
  let contentDescription = "";
  let images: string[] = [];

  if (parsedFile.images && parsedFile.images.length > 0) {
    // Image - use vision (most common for invoices/receipts)
    contentDescription =
      "This is an invoice or receipt image. Please analyze and extract all data including line items.";
    images = parsedFile.images;
  } else if (parsedFile.text) {
    // PDF text
    contentDescription = `This is an invoice/receipt PDF. Extracted text:

${parsedFile.text.slice(0, 15000)}`; // Limit text length
  } else if (parsedFile.rows && parsedFile.rows.length > 0) {
    // CSV/Excel (less common for invoices but possible)
    contentDescription = `This is invoice data in tabular format with ${parsedFile.rows.length} rows.

Column names: ${Object.keys(parsedFile.rows[0]).join(", ")}

Data (first 50 rows shown):
${JSON.stringify(parsedFile.rows.slice(0, 50), null, 2)}`;
  } else {
    throw new Error("No content available for extraction");
  }

  const prompt = `${INVOICE_EXTRACTION_PROMPT}

DOCUMENT CONTENT:
${contentDescription}`;

  const response = await queryGemini<InvoiceExtractionResult>({
    prompt,
    images,
    jsonSchema: INVOICE_EXTRACTION_SCHEMA,
  });

  if (!response.success || !response.data) {
    return {
      sourceType: "invoice",
      confidence: 0,
      isCorrectDocType: false,
      detectedDocType: "unknown",
      invoices: [],
      warnings: [response.error || "AI extraction failed"],
    };
  }

  return {
    ...response.data,
    sourceType: "invoice",
  };
}
