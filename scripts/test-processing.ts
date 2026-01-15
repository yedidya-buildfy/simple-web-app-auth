/**
 * Test script for the file processing pipeline
 * Run with: npx tsx scripts/test-processing.ts
 */

import { parseFile } from "../src/lib/processors/parsers";
import { extractData } from "../src/lib/processors/extractors";
import { SourceType } from "../src/lib/processors/types";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

interface TestCase {
  name: string;
  file: string;
  sourceType: SourceType;
}

async function testFile(testCase: TestCase) {
  console.log("\n" + "=".repeat(60));
  console.log(`Testing: ${testCase.name}`);
  console.log("=".repeat(60));
  console.log(`File: ${path.basename(testCase.file)}`);
  console.log(`Source type: ${testCase.sourceType}`);

  try {
    // Read file
    const buffer = fs.readFileSync(testCase.file);
    console.log(`File read, size: ${buffer.length} bytes`);

    // Parse file
    const parsed = await parseFile(buffer, path.basename(testCase.file));
    console.log(`Parsed: ${parsed.rows?.length || 0} rows, ${parsed.text?.length || 0} chars text, ${parsed.images?.length || 0} images`);

    // Extract data
    const extraction = await extractData(parsed, testCase.sourceType);
    console.log(`Extraction result:`, {
      confidence: extraction.confidence,
      isCorrectDocType: extraction.isCorrectDocType,
      detectedDocType: extraction.detectedDocType,
    });

    if (extraction.sourceType === "bank" || extraction.sourceType === "credit_card") {
      console.log(`Transactions: ${extraction.transactions.length}`);
      if (extraction.transactions.length > 0) {
        console.log(`  First: ${extraction.transactions[0].date} - ${extraction.transactions[0].description} - ${extraction.transactions[0].amount}`);
      }
    } else if (extraction.sourceType === "invoice") {
      console.log(`Invoices: ${extraction.invoices.length}`);
      if (extraction.invoices.length > 0) {
        console.log(`  First: ${extraction.invoices[0].vendorName} - ${extraction.invoices[0].total}`);
      }
    }

    console.log("✓ SUCCESS");
    return true;
  } catch (error) {
    console.error("✗ FAILED:", error);
    return false;
  }
}

async function testProcessing() {
  const samplesDir = "/Users/yedidya/Desktop/Everything/invoices-2/samples";

  console.log("=".repeat(60));
  console.log("File Processing Pipeline Test Suite");
  console.log("=".repeat(60));
  console.log(`GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);

  const testCases: TestCase[] = [
    {
      name: "Bank - PayPal CSV",
      file: path.join(samplesDir, "bank", "PayPal_Expense_Report_Sep_Oct_2025 - PayPal Expenses Report.csv"),
      sourceType: "bank",
    },
    {
      name: "Credit Card - Excel",
      file: path.join(samplesDir, "credit card", "credit_expenses_by_month.xlsx"),
      sourceType: "credit_card",
    },
    {
      name: "Invoice - PDF",
      file: path.join(samplesDir, "invoices", "40001-original.pdf"),
      sourceType: "invoice",
    },
  ];

  const results: { name: string; success: boolean }[] = [];

  for (const testCase of testCases) {
    if (!fs.existsSync(testCase.file)) {
      console.log(`\nSkipping ${testCase.name}: File not found`);
      results.push({ name: testCase.name, success: false });
      continue;
    }
    const success = await testFile(testCase);
    results.push({ name: testCase.name, success });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  let passed = 0;
  for (const result of results) {
    console.log(`${result.success ? "✓" : "✗"} ${result.name}`);
    if (result.success) passed++;
  }
  console.log(`\n${passed}/${results.length} tests passed`);

  if (passed < results.length) {
    process.exit(1);
  }
}

testProcessing();
