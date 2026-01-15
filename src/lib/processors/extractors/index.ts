import { ParsedFile, SourceType, ExtractionResult } from "../types";
import { extractBankData } from "./bank";
import { extractCreditCardData } from "./credit-card";
import { extractInvoiceData } from "./invoice";

export { extractBankData } from "./bank";
export { extractCreditCardData } from "./credit-card";
export { extractInvoiceData } from "./invoice";

/**
 * Extract data based on source type
 */
export async function extractData(
  parsedFile: ParsedFile,
  sourceType: SourceType
): Promise<ExtractionResult> {
  switch (sourceType) {
    case "bank":
      return extractBankData(parsedFile);
    case "credit_card":
      return extractCreditCardData(parsedFile);
    case "invoice":
      return extractInvoiceData(parsedFile);
    default:
      throw new Error(`Unknown source type: ${sourceType}`);
  }
}
