import Papa from "papaparse";
import { ParsedFile, ParsedRow } from "../types";

/**
 * Parse CSV file to raw rows
 */
export async function parseCSV(buffer: Buffer): Promise<ParsedFile> {
  const text = buffer.toString("utf-8");

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-convert numbers
      complete: (results) => {
        const rows = results.data as ParsedRow[];

        // Filter out completely empty rows
        const filteredRows = rows.filter((row) => {
          const values = Object.values(row);
          return values.some((v) => v !== null && v !== "" && v !== undefined);
        });

        resolve({
          fileType: "csv",
          rows: filteredRows,
          metadata: {
            // Papa doesn't provide sheet name, but we can track row count
          },
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}
