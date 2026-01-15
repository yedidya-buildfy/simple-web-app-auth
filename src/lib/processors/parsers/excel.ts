import * as XLSX from "xlsx";
import { ParsedFile, ParsedRow } from "../types";

/**
 * Parse Excel file (xlsx/xls) to raw rows
 */
export async function parseExcel(buffer: Buffer): Promise<ParsedFile> {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true, // Parse dates properly
      cellNF: true, // Keep number formats
    });

    // Get first sheet (most bank/credit card statements use first sheet)
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel file has no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Get formatted values
      defval: null, // Default for empty cells
      dateNF: "yyyy-mm-dd", // Date format
    }) as ParsedRow[];

    // Clean up rows - remove completely empty ones
    const rows = rawData.filter((row) => {
      const values = Object.values(row);
      return values.some((v) => v !== null && v !== "" && v !== undefined);
    });

    // Also try to detect if data starts from a different row
    // (some statements have headers/logos at the top)
    const cleanedRows = findDataRows(rows);

    return {
      fileType: "excel",
      rows: cleanedRows,
      metadata: {
        sheetName,
      },
    };
  } catch (error) {
    throw new Error(
      `Excel parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Try to find where the actual data starts
 * Some files have logo rows or multiple headers
 */
function findDataRows(rows: ParsedRow[]): ParsedRow[] {
  if (rows.length === 0) return rows;

  // Look for rows that have consistent column patterns
  // This is a simple heuristic - we assume data rows have similar structure

  // Count non-null values per row
  const rowScores = rows.map((row) => {
    const values = Object.values(row);
    return values.filter((v) => v !== null && v !== "").length;
  });

  // Find the most common score (likely represents data rows)
  const scoreCounts: Record<number, number> = {};
  rowScores.forEach((score) => {
    scoreCounts[score] = (scoreCounts[score] || 0) + 1;
  });

  const mostCommonScore = Object.entries(scoreCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (!mostCommonScore) return rows;

  const targetScore = parseInt(mostCommonScore[0]);

  // Keep rows that have at least 70% of the target score
  const minScore = Math.floor(targetScore * 0.7);

  return rows.filter((_, index) => rowScores[index] >= minScore);
}
