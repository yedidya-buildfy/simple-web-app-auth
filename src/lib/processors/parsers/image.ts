import { ParsedFile } from "../types";

// Supported image MIME types
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Parse image file - convert to base64 for AI processing
 */
export async function parseImage(
  buffer: Buffer,
  filename: string
): Promise<ParsedFile> {
  try {
    // Get file extension
    const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
    const mimeType = SUPPORTED_MIME_TYPES[ext] || "image/jpeg";

    // Convert buffer to base64 data URL
    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return {
      fileType: "image",
      images: [base64],
      metadata: {},
    };
  } catch (error) {
    throw new Error(
      `Image parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if file is a supported image type
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return ext in SUPPORTED_MIME_TYPES;
}
