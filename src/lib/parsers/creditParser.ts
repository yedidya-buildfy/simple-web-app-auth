import * as XLSX from 'xlsx'
import { supabase } from '../supabase'
import { parseCreditCardPDF } from './creditPDFParser'

/**
 * Credit Card Parser for InvoiceMatch
 * Handles Excel/CSV/PDF parsing for credit card statements
 * Supports: Isracard, Cal, Leumi Card, Max, Diners, Amex, Generic Visa/MasterCard
 * PDF parsing uses Gemini AI for extraction
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreditTransaction {
  date: Date
  source: string // card provider + last 4 digits
  description: string
  amount: number
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP'
  reference: string
  direction: 'expense' | 'credit_detail'
  business: string
  installments?: number
  installmentNumber?: number
  originalAmount?: number
  originalCurrency?: string
  exchangeRate?: number
}

export type CreditProvider =
  | 'isracard'
  | 'cal'
  | 'leumi_card'
  | 'max'
  | 'diners'
  | 'amex'
  | 'generic'

export interface CreditFormat {
  provider: CreditProvider
  dateColumn: string
  businessColumn: string
  amountColumn: string
  currencyColumn?: string
  installmentsColumn?: string
  descriptionColumn?: string
  referenceColumn?: string
  cardNumberColumn?: string
  originalAmountColumn?: string
  originalCurrencyColumn?: string
}

// ============================================================================
// CREDIT CARD FORMAT DEFINITIONS
// ============================================================================

const CREDIT_FORMATS: Record<CreditProvider, CreditFormat> = {
  isracard: {
    provider: 'isracard',
    dateColumn: 'תאריך עסקה',
    businessColumn: 'שם בית עסק',
    amountColumn: 'סכום חיוב',
    currencyColumn: 'מטבע',
    installmentsColumn: 'תשלומים',
    descriptionColumn: 'פירוט',
    referenceColumn: 'אסמכתא',
    cardNumberColumn: 'מספר כרטיס',
    originalAmountColumn: 'סכום מקורי',
    originalCurrencyColumn: 'מטבע מקורי'
  },
  cal: {
    provider: 'cal',
    dateColumn: 'תאריך',
    businessColumn: 'שם בית עסק',
    amountColumn: 'סכום',
    currencyColumn: 'מטבע',
    installmentsColumn: 'מס תשלומים',
    descriptionColumn: 'תיאור',
    referenceColumn: 'אסמכתא',
    cardNumberColumn: '4 ספרות אחרונות'
  },
  leumi_card: {
    provider: 'leumi_card',
    dateColumn: 'תאריך רכישה',
    businessColumn: 'שם בית העסק',
    amountColumn: 'סכום העסקה',
    currencyColumn: 'מטבע',
    installmentsColumn: 'תשלומים',
    descriptionColumn: 'פרטים',
    referenceColumn: 'מספר אסמכתא',
    cardNumberColumn: 'כרטיס'
  },
  max: {
    provider: 'max',
    dateColumn: 'תאריך',
    businessColumn: 'בית עסק',
    amountColumn: 'סכום',
    currencyColumn: 'מט',
    installmentsColumn: 'תשלום',
    descriptionColumn: 'תיאור',
    referenceColumn: 'אסמכתא',
    cardNumberColumn: 'כרטיס'
  },
  diners: {
    provider: 'diners',
    dateColumn: 'Date',
    businessColumn: 'Merchant',
    amountColumn: 'Amount',
    currencyColumn: 'Currency',
    installmentsColumn: 'Installments',
    descriptionColumn: 'Description',
    referenceColumn: 'Reference',
    cardNumberColumn: 'Card'
  },
  amex: {
    provider: 'amex',
    dateColumn: 'Date',
    businessColumn: 'Description',
    amountColumn: 'Amount',
    currencyColumn: 'Currency',
    installmentsColumn: 'Installments',
    descriptionColumn: 'Details',
    referenceColumn: 'Reference',
    cardNumberColumn: 'Card Number'
  },
  generic: {
    provider: 'generic',
    dateColumn: 'date',
    businessColumn: 'description',
    amountColumn: 'amount',
    currencyColumn: 'currency',
    descriptionColumn: 'details',
    referenceColumn: 'reference'
  }
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Detect credit card format from Excel/CSV headers
 */
export function detectCreditFormat(firstRows: any[]): CreditProvider | null {
  if (!firstRows || firstRows.length === 0) return null

  const headers = Object.keys(firstRows[0]).map(h => h.trim())

  // Check each format
  for (const [provider, format] of Object.entries(CREDIT_FORMATS)) {
    const requiredColumns = [
      format.dateColumn,
      format.businessColumn,
      format.amountColumn
    ]

    const matchCount = requiredColumns.filter(col =>
      headers.some(h => h.includes(col) || col.includes(h))
    ).length

    // If at least 2 out of 3 required columns match, consider it a match
    if (matchCount >= 2) {
      return provider as CreditProvider
    }
  }

  return null
}

/**
 * Get column value with fuzzy matching
 */
function getColumnValue(row: any, columnName: string | undefined): any {
  if (!columnName) return null

  // Exact match
  if (row[columnName] !== undefined) {
    return row[columnName]
  }

  // Fuzzy match
  const keys = Object.keys(row)
  const fuzzyMatch = keys.find(k =>
    k.includes(columnName) || columnName.includes(k)
  )

  return fuzzyMatch ? row[fuzzyMatch] : null
}

// ============================================================================
// EXCEL/CSV PARSING
// ============================================================================

/**
 * Parse Excel file to array of objects
 */
function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read Excel file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse CSV file to array of objects
 */
function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const workbook = XLSX.read(text, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read CSV file'))
    reader.readAsText(file)
  })
}

// ============================================================================
// DATE PARSING
// ============================================================================

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string | number): Date | null {
  if (!dateStr) return null

  // Handle Excel serial dates
  if (typeof dateStr === 'number') {
    const date = XLSX.SSF.parse_date_code(dateStr)
    return new Date(date.y, date.m - 1, date.d)
  }

  // Handle string dates
  const str = String(dateStr).trim()

  // DD/MM/YYYY or DD/MM/YY
  const ddmmyyyy = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (ddmmyyyy) {
    let year = parseInt(ddmmyyyy[3])
    if (year < 100) year += 2000
    return new Date(year, parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]))
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (yyyymmdd) {
    return new Date(
      parseInt(yyyymmdd[1]),
      parseInt(yyyymmdd[2]) - 1,
      parseInt(yyyymmdd[3])
    )
  }

  return null
}

// ============================================================================
// AMOUNT PARSING
// ============================================================================

/**
 * Parse amount from string
 */
function parseAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return Math.abs(amountStr)

  const str = String(amountStr).trim()
    .replace(/[,\s]/g, '') // Remove commas and spaces
    .replace(/[₪$€£]/g, '') // Remove currency symbols

  const amount = parseFloat(str)
  return isNaN(amount) ? 0 : Math.abs(amount)
}

// ============================================================================
// BUSINESS NAME EXTRACTION
// ============================================================================

/**
 * Extract and normalize business name from description
 */
export function extractBusinessName(description: string): string {
  if (!description) return 'Unknown'

  let business = description.trim()

  // Remove asterisks and codes
  business = business.replace(/\*[A-Z0-9]+$/i, '')

  // Remove card provider prefixes
  business = business.replace(/^(PAYPAL|VISA|MC|AMEX|MASTERCARD)\s?\*/i, '')

  // Remove common suffixes
  business = business.replace(/\s+(IL|ISR|ISRAEL|USA|US)$/i, '')

  // Title case for English names
  if (/^[A-Z\s]+$/.test(business)) {
    business = business.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return business.trim() || 'Unknown'
}

// ============================================================================
// REFUND DETECTION
// ============================================================================

/**
 * Detect if transaction is a refund/credit
 */
export function detectRefund(amount: number, description: string): {
  direction: 'expense' | 'credit_detail'
} {
  // Check for negative amounts (some credit cards show refunds as negative)
  if (amount < 0) {
    return { direction: 'credit_detail' }
  }

  // Check description for refund keywords
  const refundKeywords = /זיכוי|credit|refund|החזר|return|reversal/i
  if (refundKeywords.test(description)) {
    return { direction: 'credit_detail' }
  }

  return { direction: 'expense' }
}

// ============================================================================
// CURRENCY CONVERSION
// ============================================================================

/**
 * Detect currency conversion from row
 */
export function detectCurrencyConversion(
  row: any,
  format: CreditFormat
): {
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  convertedCurrency: string
  exchangeRate: number
} | null {
  const originalAmountStr = getColumnValue(row, format.originalAmountColumn)
  const originalCurrencyStr = getColumnValue(row, format.originalCurrencyColumn)

  if (!originalAmountStr || !originalCurrencyStr) {
    return null
  }

  const originalAmount = parseAmount(originalAmountStr)
  const convertedAmountStr = getColumnValue(row, format.amountColumn)
  const convertedAmount = parseAmount(convertedAmountStr)
  const convertedCurrency = getColumnValue(row, format.currencyColumn) || 'ILS'

  if (originalAmount > 0 && convertedAmount > 0) {
    return {
      originalAmount,
      originalCurrency: String(originalCurrencyStr).trim(),
      convertedAmount,
      convertedCurrency: String(convertedCurrency).trim(),
      exchangeRate: convertedAmount / originalAmount
    }
  }

  return null
}

// ============================================================================
// INSTALLMENT HANDLING
// ============================================================================

/**
 * Handle installment payments - split into multiple transactions
 */
export function handleInstallments(tx: CreditTransaction): CreditTransaction[] {
  if (!tx.installments || tx.installments <= 1) {
    return [tx]
  }

  const transactions: CreditTransaction[] = []
  const amountPerInstallment = tx.amount / tx.installments

  for (let i = 1; i <= tx.installments; i++) {
    const installmentDate = new Date(tx.date)
    installmentDate.setMonth(installmentDate.getMonth() + (i - 1))

    transactions.push({
      ...tx,
      amount: amountPerInstallment,
      installmentNumber: i,
      description: `${tx.description} (תשלום ${i}/${tx.installments})`,
      date: installmentDate
    })
  }

  return transactions
}

// ============================================================================
// VENDOR ALIAS MATCHING
// ============================================================================

/**
 * Match vendor alias from database
 */
export async function matchVendorAlias(
  businessName: string,
  userId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('vendor_aliases')
      .select('primary_name, aliases')
      .or(`primary_name.ilike.%${businessName}%,aliases.cs.{${businessName}}`)
      .maybeSingle()

    if (error) {
      console.error('Error matching vendor alias:', error)
      return businessName
    }

    if (data) {
      return data.primary_name
    }

    return businessName
  } catch (error) {
    console.error('Error in matchVendorAlias:', error)
    return businessName
  }
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Parse credit card statement file (Excel/CSV/PDF)
 */
export async function parseCreditStatement(
  file: File,
  cardProvider?: string,
  userId?: string,
  fileUrl?: string
): Promise<CreditTransaction[]> {
  try {
    // Parse file based on type
    const fileType = file.name.toLowerCase().split('.').pop()

    // Handle PDF files with Gemini AI
    if (fileType === 'pdf') {
      if (!fileUrl) {
        throw new Error('File URL is required for PDF parsing')
      }

      const provider = cardProvider || 'Credit Card'
      const transactions = await parseCreditCardPDF(fileUrl, provider)

      // Apply vendor alias matching if userId provided
      if (userId) {
        for (const tx of transactions) {
          tx.business = await matchVendorAlias(tx.business, userId)
        }
      }

      return transactions
    }

    // Handle Excel/CSV files
    let rawData: any[]

    if (fileType === 'xlsx' || fileType === 'xls') {
      rawData = await parseExcel(file)
    } else if (fileType === 'csv') {
      rawData = await parseCSV(file)
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }

    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in file')
    }

    // Detect format if not provided
    let provider: CreditProvider | null = cardProvider as CreditProvider
    if (!provider) {
      provider = detectCreditFormat(rawData)
      if (!provider) {
        throw new Error('Could not detect credit card format')
      }
    }

    const format = CREDIT_FORMATS[provider]
    const transactions: CreditTransaction[] = []

    // Extract card number for source
    const cardNumber = getColumnValue(rawData[0], format.cardNumberColumn)
    const cardLast4 = cardNumber ? String(cardNumber).slice(-4) : '****'
    const sourcePrefix = format.provider.replace('_', ' ').toUpperCase()

    // Process each row
    for (const row of rawData) {
      const dateStr = getColumnValue(row, format.dateColumn)
      const date = parseDate(dateStr)

      if (!date) continue

      const description = String(
        getColumnValue(row, format.descriptionColumn) ||
        getColumnValue(row, format.businessColumn) ||
        ''
      ).trim()

      if (!description) continue

      const amountStr = getColumnValue(row, format.amountColumn)
      const amount = parseAmount(amountStr)

      if (amount === 0) continue

      const businessName = extractBusinessName(
        getColumnValue(row, format.businessColumn) || description
      )

      const finalBusinessName = userId
        ? await matchVendorAlias(businessName, userId)
        : businessName

      const currency = (getColumnValue(row, format.currencyColumn) || 'ILS') as any
      const reference = String(getColumnValue(row, format.referenceColumn) || '').trim()
      const installmentsStr = getColumnValue(row, format.installmentsColumn)
      const installments = installmentsStr ? parseInt(String(installmentsStr)) : undefined

      const { direction } = detectRefund(amount, description)
      const currencyConversion = detectCurrencyConversion(row, format)

      const transaction: CreditTransaction = {
        date,
        source: `${sourcePrefix} ${cardLast4}`,
        description,
        amount,
        currency,
        reference,
        direction,
        business: finalBusinessName,
        installments,
        ...(currencyConversion && {
          originalAmount: currencyConversion.originalAmount,
          originalCurrency: currencyConversion.originalCurrency,
          exchangeRate: currencyConversion.exchangeRate
        })
      }

      transactions.push(transaction)
    }

    // Handle installments - split transactions if needed
    const finalTransactions: CreditTransaction[] = []
    for (const tx of transactions) {
      const installmentTxs = handleInstallments(tx)
      finalTransactions.push(...installmentTxs)
    }

    return finalTransactions
  } catch (error) {
    console.error('Error parsing credit statement:', error)
    throw error
  }
}
