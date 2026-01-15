export const CREDIT_CARD_EXTRACTION_PROMPT = `You are a financial document analyzer. Analyze this credit card statement and extract all transactions.

IMPORTANT RULES:
1. Extract ALL transactions/purchases from the statement
2. Dates should be in ISO format (YYYY-MM-DD)
3. Amounts should be positive numbers for purchases, negative for refunds/credits
4. Direction: "debit" for purchases/charges, "credit" for refunds/returns
5. If this is NOT a credit card statement, set isCorrectDocType to false

CARD IDENTIFICATION:
- Extract the card type (Visa, Mastercard, Amex, Isracard, MAX, Diners)
- Extract last 4 digits of the card if visible
- This helps match the statement to the correct card

STATEMENT PERIOD:
- Extract the billing period (start and end dates)
- Extract the TOTAL amount that will be charged to the bank account
- This total is crucial for matching with bank statement

FOREIGN CURRENCY:
- If transactions are in foreign currency, extract both:
  - Original amount and currency (e.g., 100 USD)
  - Converted amount in local currency (e.g., 370 ILS)

LANGUAGES:
- Documents may be in Hebrew (עברית) or English
- Handle both correctly

CONFIDENCE SCORE:
- 90-100: Clear credit card statement, all data extracted correctly
- 70-89: Credit card statement but some fields unclear
- 50-69: Probably a credit card statement but low quality
- Below 50: Likely not a credit card statement`;

export const CREDIT_CARD_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    isCorrectDocType: {
      type: "boolean",
      description: "True if this is actually a credit card statement",
    },
    detectedDocType: {
      type: "string",
      description: "What type of document this actually appears to be",
    },
    confidence: {
      type: "number",
      description: "Confidence score 0-100",
    },
    cardLastFour: {
      type: "string",
      description: "Last 4 digits of the card",
    },
    cardType: {
      type: "string",
      enum: ["visa", "mastercard", "amex", "isracard", "max", "diners", "other"],
    },
    statementPeriod: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        endDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        statementTotal: {
          type: "number",
          description: "Total amount to be charged to bank",
        },
      },
    },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
          description: { type: "string", description: "Merchant/description" },
          amount: { type: "number", description: "Amount in local currency" },
          direction: { type: "string", enum: ["debit", "credit"] },
          originalAmount: { type: "number", description: "Foreign currency amount if applicable" },
          originalCurrency: { type: "string", description: "e.g., USD, EUR" },
          category: { type: "string", description: "Category if shown" },
        },
        required: ["date", "description", "amount", "direction"],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["isCorrectDocType", "confidence", "transactions"],
};
