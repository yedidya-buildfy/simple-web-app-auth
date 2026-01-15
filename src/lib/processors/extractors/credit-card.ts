import { queryGemini } from "../ai/gemini";
import {
  CREDIT_CARD_EXTRACTION_PROMPT,
  CREDIT_CARD_EXTRACTION_SCHEMA,
} from "../ai/prompts/credit-card";
import { ParsedFile, CreditCardExtractionResult } from "../types";

/**
 * Extract credit card statement data using AI
 */
export async function extractCreditCardData(
  parsedFile: ParsedFile
): Promise<CreditCardExtractionResult> {
  // Prepare content for AI based on file type
  let contentDescription = "";
  let images: string[] = [];

  if (parsedFile.rows && parsedFile.rows.length > 0) {
    // CSV/Excel - send structured data
    contentDescription = `This is a credit card statement in tabular format with ${parsedFile.rows.length} rows.

Column names: ${Object.keys(parsedFile.rows[0]).join(", ")}

Data (first 100 rows shown):
${JSON.stringify(parsedFile.rows.slice(0, 100), null, 2)}`;
  } else if (parsedFile.text) {
    // PDF text
    contentDescription = `This is a credit card statement PDF. Extracted text:

${parsedFile.text.slice(0, 15000)}`; // Limit text length
  } else if (parsedFile.images && parsedFile.images.length > 0) {
    // Image-based - use vision
    contentDescription =
      "This is a credit card statement image. Please analyze and extract all transactions.";
    images = parsedFile.images;
  } else {
    throw new Error("No content available for extraction");
  }

  const prompt = `${CREDIT_CARD_EXTRACTION_PROMPT}

DOCUMENT CONTENT:
${contentDescription}`;

  const response = await queryGemini<CreditCardExtractionResult>({
    prompt,
    images,
    jsonSchema: CREDIT_CARD_EXTRACTION_SCHEMA,
  });

  if (!response.success || !response.data) {
    return {
      sourceType: "credit_card",
      confidence: 0,
      isCorrectDocType: false,
      detectedDocType: "unknown",
      transactions: [],
      warnings: [response.error || "AI extraction failed"],
    };
  }

  return {
    ...response.data,
    sourceType: "credit_card",
  };
}
