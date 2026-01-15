export const BANK_EXTRACTION_PROMPT = `You are a financial document analyzer. Analyze this bank statement and extract all transactions.

IMPORTANT RULES:
1. Extract ALL transactions you can find
2. Dates should be in ISO format (YYYY-MM-DD)
3. Amounts should be positive numbers
4. Direction: "debit" for money going OUT (expenses, payments), "credit" for money coming IN (deposits, refunds)
5. Look for credit card payment lines - these are typically labeled with card names like "VISA", "Mastercard", "MAX", "Isracard", "כרטיס אשראי"
6. If this is NOT a bank statement, set isCorrectDocType to false and describe what you think it is

DETECT CREDIT CARD PAYMENTS:
- Look for transactions that appear to be credit card bill payments
- Extract the card identifier if visible (e.g., "VISA *1234", "כרטיס 1234")
- These are important for linking to credit card statements later

STATEMENT PERIOD:
- Try to find the statement period (start and end dates)
- Look for headers like "תקופה", "Period", "From/To dates"
- Extract the total if visible

LANGUAGES:
- Documents may be in Hebrew (עברית) or English
- Handle both correctly

CONFIDENCE SCORE:
- 90-100: Clear bank statement, all data extracted correctly
- 70-89: Bank statement but some fields unclear or missing
- 50-69: Probably a bank statement but low quality or partial data
- Below 50: Likely not a bank statement`;

export const BANK_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    isCorrectDocType: {
      type: "boolean",
      description: "True if this is actually a bank statement",
    },
    detectedDocType: {
      type: "string",
      description: "What type of document this actually appears to be",
    },
    confidence: {
      type: "number",
      description: "Confidence score 0-100",
    },
    statementPeriod: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        endDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        statementTotal: { type: "number" },
      },
    },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
          description: { type: "string" },
          amount: { type: "number", description: "Positive number" },
          direction: { type: "string", enum: ["debit", "credit"] },
          reference: { type: "string" },
          balance: { type: "number" },
        },
        required: ["date", "description", "amount", "direction"],
      },
    },
    creditCardPayments: {
      type: "array",
      description: "Detected credit card payment transactions",
      items: {
        type: "object",
        properties: {
          transactionIndex: {
            type: "number",
            description: "Index in transactions array",
          },
          description: { type: "string" },
          amount: { type: "number" },
          date: { type: "string" },
          suggestedCardName: {
            type: "string",
            description: "e.g., VISA, Mastercard, MAX",
          },
          suggestedLastFour: {
            type: "string",
            description: "Last 4 digits if visible",
          },
          confidence: { type: "number" },
        },
        required: ["transactionIndex", "description", "amount", "date", "confidence"],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Any issues or warnings about the extraction",
    },
  },
  required: ["isCorrectDocType", "confidence", "transactions", "creditCardPayments"],
};
