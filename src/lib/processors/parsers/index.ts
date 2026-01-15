import { ParsedFile, FileType } from "../types";
import { parseCSV } from "./csv";
import { parseExcel } from "./excel";
import { parsePDF } from "./pdf";
import { parseImage, isImageFile } from "./image";

export { parseCSV } from "./csv";
export { parseExcel } from "./excel";
export { parsePDF } from "./pdf";
export { parseImage, isImageFile } from "./image";

/**
 * Detect file type from filename and MIME type
 */
export function detectFileType(
  filename: string,
  mimeType?: string
): FileType | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));

  // Check by extension first
  if (ext === ".csv") return "csv";
  if (ext === ".xlsx" || ext === ".xls") return "excel";
  if (ext === ".pdf") return "pdf";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return "image";

  // Check by MIME type
  if (mimeType) {
    if (mimeType === "text/csv") return "csv";
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    )
      return "excel";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("image/")) return "image";
  }

  return null;
}

/**
 * Parse file based on its type
 */
export async function parseFile(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ParsedFile> {
  console.log(`[PARSER] Parsing file: ${filename}, mimeType: ${mimeType}`);
  const fileType = detectFileType(filename, mimeType);
  console.log(`[PARSER] Detected file type: ${fileType}`);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${filename}`);
  }

  try {
    let result: ParsedFile;
    switch (fileType) {
      case "csv":
        console.log("[PARSER] Using CSV parser...");
        result = await parseCSV(buffer);
        break;
      case "excel":
        console.log("[PARSER] Using Excel parser...");
        result = await parseExcel(buffer);
        break;
      case "pdf":
        console.log("[PARSER] Using PDF parser...");
        result = await parsePDF(buffer);
        break;
      case "image":
        console.log("[PARSER] Using Image parser...");
        result = await parseImage(buffer, filename);
        break;
      default:
        throw new Error(`Parser not implemented for: ${fileType}`);
    }
    console.log(`[PARSER] Parse complete. Rows: ${result.rows?.length || 0}, Text length: ${result.text?.length || 0}, Images: ${result.images?.length || 0}`);
    return result;
  } catch (error) {
    console.error(`[PARSER] Parse error:`, error);
    throw error;
  }
}
