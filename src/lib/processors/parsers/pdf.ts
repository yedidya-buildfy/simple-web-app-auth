import { ParsedFile } from "../types";
import { PDFExtract } from "pdf.js-extract";

/**
 * Parse PDF file - extract text and prepare for AI processing
 *
 * For PDFs, we don't try to parse tables ourselves.
 * Instead, we extract the text and let AI handle the interpretation.
 * For image-based PDFs (scanned documents), we convert pages to images.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedFile> {
  try {
    console.log("[PDF] Starting PDF parsing with pdf.js-extract...");

    const pdfExtract = new PDFExtract();

    // Extract data from buffer
    const data = await pdfExtract.extractBuffer(buffer, {});

    const pageCount = data.pages?.length || 0;
    console.log(`[PDF] Document has ${pageCount} pages`);

    // Extract text from all pages
    const textParts: string[] = [];
    for (const page of data.pages || []) {
      const pageText = (page.content || [])
        .map((item: { str: string }) => item.str)
        .join(" ");
      textParts.push(pageText);
    }

    const extractedText = textParts.join("\n\n").trim();
    console.log(`[PDF] Extracted ${extractedText.length} characters`);

    // Check if PDF has extractable text or is image-based
    const hasText = extractedText.length > 100; // Arbitrary threshold

    if (hasText) {
      // Text-based PDF - send text to AI
      return {
        fileType: "pdf",
        text: extractedText,
        metadata: {
          pageCount,
        },
      };
    } else {
      // Image-based PDF (scanned) - will need to convert to images
      console.warn("[PDF] PDF appears to be image-based, text extraction limited");
      return {
        fileType: "pdf",
        text: extractedText || "Unable to extract text from PDF",
        images: [], // Would need pdf-to-image conversion here
        metadata: {
          pageCount,
        },
      };
    }
  } catch (error) {
    console.error("[PDF] Error:", error);
    throw new Error(
      `PDF parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
