export const INVOICE_EXTRACTION_PROMPT = `You are a financial document analyzer. Analyze this invoice/receipt and extract all relevant data.

IMPORTANT RULES:
1. Extract ALL line items from the invoice
2. Dates should be in ISO format (YYYY-MM-DD)
3. Amounts should be positive numbers
4. If there are MULTIPLE invoices in one document, extract each one separately
5. If this is NOT an invoice/receipt, set isCorrectDocType to false

DOCUMENT TYPE:
- "invoice": חשבונית / חשבונית מס - formal invoice
- "receipt": קבלה - payment receipt
- "credit_note": חשבונית זיכוי - credit/refund note
- "other": Not a financial document

EXTRACT THESE FIELDS:
- Vendor/business name (who issued the invoice)
- Invoice/receipt number
- Issue date
- Due date (if shown, for invoices)
- Currency (default ILS if not specified)
- Line items with: description, quantity, unit price, total
- Subtotal (before VAT)
- VAT rate (usually 17% in Israel) and VAT amount
- Total amount

MULTIPLE INVOICES:
- If the document contains multiple invoices/receipts, extract each one separately
- Each invoice should have its own set of line items

LANGUAGES:
- Documents may be in Hebrew (עברית) or English
- Handle both correctly
- Common Hebrew terms:
  - חשבונית מס = Tax Invoice
  - קבלה = Receipt
  - מע"מ = VAT
  - סה"כ = Total
  - לפני מע"מ = Before VAT

CONFIDENCE SCORE:
- 90-100: Clear invoice with all fields visible
- 70-89: Invoice but some fields unclear or missing
- 50-69: Probably an invoice but low quality
- Below 50: Likely not an invoice/receipt`;

export const INVOICE_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    isCorrectDocType: {
      type: "boolean",
      description: "True if this is actually an invoice/receipt",
    },
    detectedDocType: {
      type: "string",
      description: "What type of document this actually appears to be",
    },
    confidence: {
      type: "number",
      description: "Confidence score 0-100",
    },
    invoices: {
      type: "array",
      description: "All invoices found in the document",
      items: {
        type: "object",
        properties: {
          vendorName: { type: "string", description: "Business/vendor name" },
          documentType: {
            type: "string",
            enum: ["invoice", "receipt", "credit_note", "other"],
          },
          documentNumber: { type: "string", description: "Invoice/receipt number" },
          issueDate: { type: "string", description: "ISO date YYYY-MM-DD" },
          dueDate: { type: "string", description: "ISO date YYYY-MM-DD" },
          currency: { type: "string", description: "Default ILS" },
          subtotal: { type: "number", description: "Amount before VAT" },
          vatRate: { type: "number", description: "VAT percentage (e.g., 17)" },
          vatAmount: { type: "number", description: "VAT amount" },
          total: { type: "number", description: "Total amount including VAT" },
          rows: {
            type: "array",
            description: "Line items",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number", description: "Default 1" },
                unitPrice: { type: "number" },
                total: { type: "number" },
              },
              required: ["description", "total"],
            },
          },
        },
        required: ["vendorName", "documentType", "total", "rows"],
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["isCorrectDocType", "confidence", "invoices"],
};
