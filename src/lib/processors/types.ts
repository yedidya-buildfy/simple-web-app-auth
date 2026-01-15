// ============================================
// File Processing Types
// ============================================

export type FileType = "csv" | "excel" | "pdf" | "image";
export type SourceType = "bank" | "credit_card" | "invoice";
export type ProcessingStatus = "uploaded" | "pending" | "processed" | "failed";

// ============================================
// Raw Parsed Data (Stage 1 Output)
// ============================================

export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ParsedFile {
  fileType: FileType;
  rows?: ParsedRow[]; // For CSV/Excel
  text?: string; // For PDF text
  images?: string[]; // Base64 images for AI processing
  metadata?: {
    sheetName?: string;
    pageCount?: number;
  };
}

// ============================================
// Extraction Results (Stage 2 Output)
// ============================================

export interface ExtractedTransaction {
  date: string; // ISO date YYYY-MM-DD
  description: string;
  amount: number; // Always positive
  direction: "debit" | "credit";
  reference?: string;
  balance?: number;
  originalAmount?: number; // Foreign currency
  originalCurrency?: string;
  category?: string;
}

export interface ExtractedInvoiceRow {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractedInvoice {
  vendorName: string;
  documentType: "invoice" | "receipt" | "credit_note" | "other";
  documentNumber?: string;
  issueDate?: string; // ISO date
  dueDate?: string; // ISO date
  currency: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total: number;
  rows: ExtractedInvoiceRow[];
}

// ============================================
// Statement Period
// ============================================

export interface StatementPeriod {
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  statementTotal?: number;
}

// ============================================
// Credit Card Detection
// ============================================

export interface DetectedCreditCardPayment {
  transactionIndex: number;
  description: string;
  amount: number;
  date: string;
  suggestedCardName?: string;
  suggestedLastFour?: string;
  confidence: number; // 0-100
}

// ============================================
// Extraction Response (Full AI Response)
// ============================================

export interface BankExtractionResult {
  sourceType: "bank";
  confidence: number; // 0-100
  isCorrectDocType: boolean;
  detectedDocType?: string; // What AI thinks it actually is
  statementPeriod?: StatementPeriod;
  transactions: ExtractedTransaction[];
  creditCardPayments: DetectedCreditCardPayment[];
  warnings?: string[];
}

export interface CreditCardExtractionResult {
  sourceType: "credit_card";
  confidence: number;
  isCorrectDocType: boolean;
  detectedDocType?: string;
  statementPeriod?: StatementPeriod;
  cardLastFour?: string;
  cardType?: string;
  transactions: ExtractedTransaction[];
  warnings?: string[];
}

export interface InvoiceExtractionResult {
  sourceType: "invoice";
  confidence: number;
  isCorrectDocType: boolean;
  detectedDocType?: string;
  invoices: ExtractedInvoice[]; // Can be multiple per PDF
  warnings?: string[];
}

export type ExtractionResult =
  | BankExtractionResult
  | CreditCardExtractionResult
  | InvoiceExtractionResult;

// ============================================
// Duplicate Detection
// ============================================

export interface DuplicateTransaction {
  newTransaction: ExtractedTransaction;
  existingTransaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    fileId: string;
    fileName: string;
  };
  hash: string;
}

export type DuplicateAction = "skip" | "add_anyway" | "replace";

// ============================================
// Processing Pipeline
// ============================================

export interface ProcessingOptions {
  autoProcess: boolean;
  skipDuplicates: boolean;
}

export interface ProcessingResult {
  success: boolean;
  fileId: string;
  status: ProcessingStatus;
  confidence: number;
  isCorrectDocType: boolean;
  detectedDocType?: string;
  itemsCount: number;
  duplicatesFound: DuplicateTransaction[];
  creditCardPaymentsFound: DetectedCreditCardPayment[];
  statementPeriod?: StatementPeriod;
  error?: string;
  warnings?: string[];
}

// ============================================
// Credit Card Configuration
// ============================================

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  lastFour?: string;
  cardType?: string;
  bankPatterns: string[];
  typicalPaymentDay?: number;
  isActive: boolean;
}

export interface CreditCardMatch {
  creditCardId: string;
  bankTransactionId: string;
  matchConfidence: number; // 0-100
  matchReason: "amount" | "pattern" | "manual";
}
