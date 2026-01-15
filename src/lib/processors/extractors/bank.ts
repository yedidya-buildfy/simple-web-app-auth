import { queryGemini } from "../ai/gemini";
import {
  BANK_EXTRACTION_PROMPT,
  BANK_EXTRACTION_SCHEMA,
} from "../ai/prompts/bank";
import { ParsedFile, BankExtractionResult } from "../types";

/**
 * Extract bank statement data using AI
 */
export async function extractBankData(
  parsedFile: ParsedFile
): Promise<BankExtractionResult> {
  // Prepare content for AI based on file type
  let contentDescription = "";
  let images: string[] = [];

  if (parsedFile.rows && parsedFile.rows.length > 0) {
    // CSV/Excel - send structured data
    contentDescription = `This is a bank statement in tabular format with ${parsedFile.rows.length} rows.

Column names: ${Object.keys(parsedFile.rows[0]).join(", ")}

Data (first 100 rows shown):
${JSON.stringify(parsedFile.rows.slice(0, 100), null, 2)}`;
  } else if (parsedFile.text) {
    // PDF text
    contentDescription = `This is a bank statement PDF. Extracted text:

${parsedFile.text.slice(0, 15000)}`; // Limit text length
  } else if (parsedFile.images && parsedFile.images.length > 0) {
    // Image-based - use vision
    contentDescription =
      "This is a bank statement image. Please analyze and extract all transactions.";
    images = parsedFile.images;
  } else {
    throw new Error("No content available for extraction");
  }

  const prompt = `${BANK_EXTRACTION_PROMPT}

DOCUMENT CONTENT:
${contentDescription}`;

  const response = await queryGemini<BankExtractionResult>({
    prompt,
    images,
    jsonSchema: BANK_EXTRACTION_SCHEMA,
  });

  if (!response.success || !response.data) {
    return {
      sourceType: "bank",
      confidence: 0,
      isCorrectDocType: false,
      detectedDocType: "unknown",
      transactions: [],
      creditCardPayments: [],
      warnings: [response.error || "AI extraction failed"],
    };
  }

  return {
    ...response.data,
    sourceType: "bank",
  };
}
