import * as XLSX from 'xlsx'
import {
  parseCSVContent,
  findColumn,
  findHeaderRow,
  parseDate,
  parseAmount,
  cleanString
} from './csvParser'

/**
 * Simple browser-compatible hash function
 * Not cryptographically secure, but sufficient for duplicate detection
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Bank Transaction Interface
 */
export interface BankTransaction {
  date: Date
  source: string // bank name
  description: string
  amount: number
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP'
  reference: string
  direction: 'income' | 'expense' | 'transfer' | 'credit_detail'
}

/**
 * Bank Names
 */
export type BankName = 'leumi' | 'hapoalim' | 'discount' | 'mizrahi' | 'yahav' | 'generic'

/**
 * Bank Format Configuration
 */
interface BankFormat {
  name: string
  dateColumn: string[]
  descriptionColumn: string[]
  amountColumn: string[]
  currencyColumn?: string[]
  referenceColumn: string[]
  detectionKeywords: string[]
}

/**
 * Bank Format Definitions for Israeli Banks
 */
const BANK_FORMATS: Record<BankName, BankFormat> = {
  leumi: {
    name: 'Bank Leumi',
    dateColumn: ['תאריך', 'תאריך פעולה', 'date'],
    descriptionColumn: ['תיאור', 'תיאור הפעולה', 'תיאור התנועה', 'description'],
    amountColumn: ['סכום', 'זכות', 'חובה', 'זכות/חובה', 'amount'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'אסמכתה', 'reference'],
    detectionKeywords: ['לאומי', 'leumi', 'בנק לאומי']
  },
  hapoalim: {
    name: 'Bank Hapoalim',
    dateColumn: ['תאריך', 'תאריך ערך', 'תאריך פעולה', 'date'],
    descriptionColumn: ['תיאור', 'פרטים', 'אסמכתא', 'description'],
    amountColumn: ['סכום', 'חובה', 'זכות', 'amount'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'מספר אסמכתא', 'reference'],
    detectionKeywords: ['הפועלים', 'hapoalim', 'בנק הפועלים']
  },
  discount: {
    name: 'Bank Discount',
    dateColumn: ['תאריך', 'תאריך פעולה', 'date'],
    descriptionColumn: ['תיאור', 'פרטים', 'description'],
    amountColumn: ['סכום', 'חובה', 'זכות', 'amount'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'reference'],
    detectionKeywords: ['דיסקונט', 'discount', 'בנק דיסקונט']
  },
  mizrahi: {
    name: 'Bank Mizrahi',
    dateColumn: ['תאריך', 'תאריך פעולה', 'תאריך ערך', 'date'],
    descriptionColumn: ['תיאור', 'תיאור הפעולה', 'פרטים', 'description'],
    amountColumn: ['סכום', 'חובה', 'זכות', 'זכות/חובה', 'amount'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'אסמכתה', 'reference'],
    detectionKeywords: ['מזרחי', 'mizrahi', 'בנק מזרחי']
  },
  yahav: {
    name: 'Bank Yahav',
    dateColumn: ['תאריך', 'תאריך פעולה', 'date'],
    descriptionColumn: ['תיאור', 'תיאור הפעולה', 'description'],
    amountColumn: ['סכום', 'חובה', 'זכות', 'amount'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'reference'],
    detectionKeywords: ['יהב', 'yahav', 'בנק יהב']
  },
  generic: {
    name: 'Generic Bank',
    dateColumn: ['תאריך', 'date', 'תאריך פעולה', 'תאריך ערך'],
    descriptionColumn: ['תיאור', 'description', 'פרטים', 'תיאור התנועה'],
    amountColumn: ['סכום', 'amount', 'זכות', 'חובה', 'זכות/חובה'],
    currencyColumn: ['מטבע', 'currency'],
    referenceColumn: ['אסמכתא', 'reference', 'אסמכתה', 'מספר'],
    detectionKeywords: []
  }
}

/**
 * Internal transfer patterns (Hebrew)
 */
const INTERNAL_TRANSFER_PATTERNS = [
  'העברה לד.א. ונוס השקעות',
  'העברה מד.א. ונוס השקעות',
  'העברת מטח לחול',
  'העברה מסיטיבנק',
  'עמלת חליפין',
  'העברה פנימית',
  'העברה בין חשבונות'
]

/**
 * Parse Excel file using xlsx library
 */
export async function parseExcelFile(file: File): Promise<any[][]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Get first sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to array of arrays
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  })

  return data
}

/**
 * Parse CSV file using robust CSV parser
 */
export async function parseCSVFile(file: File): Promise<any[][]> {
  const text = await file.text()
  return parseCSVContent(text)
}

/**
 * Detect bank format from data
 */
export function detectBankFormat(firstRows: any[][]): BankName | null {
  // Join first few rows to analyze
  const content = firstRows.slice(0, 10).map(row => row.join(' ')).join(' ').toLowerCase()

  // Check for specific bank keywords
  for (const [bankName, format] of Object.entries(BANK_FORMATS)) {
    if (bankName === 'generic') continue

    for (const keyword of format.detectionKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        return bankName as BankName
      }
    }
  }

  // Check by file structure patterns
  const headerRow = findHeaderRow(firstRows)
  if (headerRow === -1) return null

  const headers = firstRows[headerRow].map((h: any) => h.toString().toLowerCase())

  // Leumi specific: often has "זכות/חובה" combined column
  if (headers.some(h => h.includes('זכות/חובה') || h.includes('זכות / חובה'))) {
    return 'leumi'
  }

  // Hapoalim specific: often has "תאריך ערך"
  if (headers.some(h => h.includes('תאריך ערך'))) {
    return 'hapoalim'
  }

  // Default to generic
  return 'generic'
}

/**
 * Special bank formats for Wise and PayPal
 */
interface WiseTransaction {
  id: string
  status: string
  direction: string
  createdOn: string
  sourceName: string
  sourceAmount: string
  sourceCurrency: string
  targetName: string
  reference: string
  category: string
}

interface PayPalTransaction {
  date: string
  name: string
  type: string
  currency: string
  gross: string
  net: string
  transactionId: string
  balanceImpact: string
}

/**
 * Detect if CSV is Wise format
 */
function isWiseCSV(headers: string[]): boolean {
  const headerStr = headers.join(',').toLowerCase()
  return headerStr.includes('source amount (after fees)') &&
         headerStr.includes('target amount (after fees)') &&
         headerStr.includes('created on')
}

/**
 * Detect if CSV is PayPal format
 */
function isPayPalCSV(headers: string[]): boolean {
  const headerStr = headers.join(',').toLowerCase()
  return headerStr.includes('balance impact') &&
         headerStr.includes('gross') &&
         headerStr.includes('net')
}

/**
 * Parse Wise CSV transactions
 */
function parseWiseTransactions(rows: string[][]): BankTransaction[] {
  if (rows.length < 2) return []

  const headers = rows[0]
  const transactions: BankTransaction[] = []

  const colMap = {
    id: findColumn(headers, ['ID']),
    status: findColumn(headers, ['Status']),
    direction: findColumn(headers, ['Direction']),
    createdOn: findColumn(headers, ['Created on']),
    sourceName: findColumn(headers, ['Source name']),
    sourceAmount: findColumn(headers, ['Source amount (after fees)']),
    sourceCurrency: findColumn(headers, ['Source currency']),
    targetName: findColumn(headers, ['Target name']),
    reference: findColumn(headers, ['Reference']),
    category: findColumn(headers, ['Category'])
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 5) continue

    const status = row[colMap.status] || ''
    if (status !== 'COMPLETED') continue

    const id = row[colMap.id] || ''
    const direction = row[colMap.direction] || ''
    const createdOn = row[colMap.createdOn] || ''
    const sourceName = row[colMap.sourceName] || ''
    const sourceAmount = parseAmount(row[colMap.sourceAmount])
    const sourceCurrency = (row[colMap.sourceCurrency] || 'USD').toUpperCase()
    const targetName = row[colMap.targetName] || ''
    const reference = row[colMap.reference] || ''

    if (sourceAmount === 0) continue

    const date = parseDate(createdOn)
    if (!date) continue

    const description = direction === 'IN' ? sourceName : targetName
    const transDirection = direction === 'IN' ? 'income' : 'expense'

    transactions.push({
      date,
      source: 'Wise',
      description: description || 'Wise Transfer',
      amount: Math.abs(sourceAmount),
      currency: sourceCurrency as any,
      reference: reference || id,
      direction: transDirection as any
    })
  }

  return transactions
}

/**
 * Parse PayPal CSV transactions
 */
function parsePayPalTransactions(rows: string[][]): BankTransaction[] {
  if (rows.length < 2) return []

  const headers = rows[0]
  const transactions: BankTransaction[] = []

  const colMap = {
    date: findColumn(headers, ['Date']),
    name: findColumn(headers, ['Name']),
    type: findColumn(headers, ['Type']),
    currency: findColumn(headers, ['Currency']),
    gross: findColumn(headers, ['Gross']),
    net: findColumn(headers, ['Net']),
    transactionId: findColumn(headers, ['Transaction ID']),
    balanceImpact: findColumn(headers, ['Balance Impact'])
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 5) continue

    const dateStr = row[colMap.date]
    const name = row[colMap.name] || ''
    const type = row[colMap.type] || ''
    const currency = (row[colMap.currency] || 'ILS').toUpperCase()
    const gross = parseAmount(row[colMap.gross])
    const net = parseAmount(row[colMap.net])
    const transactionId = row[colMap.transactionId] || ''
    const balanceImpact = row[colMap.balanceImpact] || ''

    if (!dateStr || (gross === 0 && net === 0)) continue

    const date = parseDate(dateStr)
    if (!date) continue

    // Determine direction based on balance impact or amount sign
    let direction: 'income' | 'expense' = 'expense'
    if (balanceImpact.toLowerCase().includes('credit') || net > 0 || gross > 0) {
      direction = 'income'
    }

    transactions.push({
      date,
      source: 'PayPal',
      description: name || type || 'PayPal Transaction',
      amount: Math.abs(net || gross),
      currency: currency as any,
      reference: transactionId,
      direction
    })
  }

  return transactions
}

/**
 * Determine transaction direction
 */
function determineDirection(description: string, amount: number): BankTransaction['direction'] {
  const desc = description.toLowerCase()

  // Check for internal transfers
  for (const pattern of INTERNAL_TRANSFER_PATTERNS) {
    if (desc.includes(pattern.toLowerCase())) return 'transfer'
  }

  // Check for credit card detail
  if (desc.includes('חיוב לכרטיס') || desc.includes('כרטיס אשראי')) {
    return 'credit_detail'
  }

  // Determine by amount sign
  return amount >= 0 ? 'income' : 'expense'
}

/**
 * Extract transactions from parsed data
 */
export function extractTransactions(
  rows: any[][],
  format: BankFormat,
  bankName: string
): BankTransaction[] {
  const transactions: BankTransaction[] = []

  // Find header row
  const headerRow = findHeaderRow(rows)
  if (headerRow === -1) {
    throw new Error('Could not find header row in file')
  }

  const headers = rows[headerRow]

  // Map columns
  const colMap = {
    date: findColumn(headers, format.dateColumn),
    description: findColumn(headers, format.descriptionColumn),
    amount: findColumn(headers, format.amountColumn),
    currency: format.currencyColumn ? findColumn(headers, format.currencyColumn) : -1,
    reference: findColumn(headers, format.referenceColumn)
  }

  // Validate required columns
  if (colMap.date === -1 || colMap.description === -1 || colMap.amount === -1) {
    throw new Error(`Missing required columns. Found: date=${colMap.date}, description=${colMap.description}, amount=${colMap.amount}`)
  }

  // Detect currency from file content if no currency column
  let defaultCurrency: BankTransaction['currency'] = 'ILS'
  if (colMap.currency === -1) {
    const fileContent = rows.slice(0, 15).map(r => r.join(' ')).join(' ')
    if (fileContent.includes('USD') || fileContent.includes('דולר')) defaultCurrency = 'USD'
    else if (fileContent.includes('EUR') || fileContent.includes('אירו')) defaultCurrency = 'EUR'
    else if (fileContent.includes('GBP') || fileContent.includes('ליש"ט')) defaultCurrency = 'GBP'
  }

  // Extract transactions
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const date = parseDate(row[colMap.date])
    if (!date) continue

    const description = cleanString(row[colMap.description])
    if (!description) continue

    const amount = parseAmount(row[colMap.amount])
    if (amount === 0) continue

    const reference = colMap.reference !== -1 ? cleanString(row[colMap.reference]) : ''

    // Get currency
    let currency = defaultCurrency
    if (colMap.currency !== -1) {
      const currencyStr = cleanString(row[colMap.currency]).toUpperCase()
      if (currencyStr === 'USD' || currencyStr === 'DOLLAR' || currencyStr === 'דולר') currency = 'USD'
      else if (currencyStr === 'EUR' || currencyStr === 'EURO' || currencyStr === 'אירו') currency = 'EUR'
      else if (currencyStr === 'GBP' || currencyStr === 'ליש"ט') currency = 'GBP'
      else if (currencyStr === 'ILS' || currencyStr === 'שקל' || currencyStr === '₪') currency = 'ILS'
    }

    const direction = determineDirection(description, amount)

    transactions.push({
      date,
      source: bankName,
      description,
      amount: Math.abs(amount),
      currency,
      reference,
      direction
    })
  }

  return transactions
}

/**
 * Generate transaction hash for duplicate detection
 */
export function generateTransactionHash(tx: BankTransaction): string {
  const dateStr = tx.date.toISOString().split('T')[0] // YYYY-MM-DD
  const uniqueString = `${dateStr}|${tx.amount.toFixed(2)}|${tx.description.substring(0, 50)}`

  return simpleHash(uniqueString)
}

/**
 * Main parser function - parse bank statement file
 */
export async function parseBankStatement(
  file: File,
  bankName?: BankName
): Promise<BankTransaction[]> {
  try {
    // Determine file type
    const fileName = file.name.toLowerCase()
    let rows: any[][]

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      rows = await parseExcelFile(file)
    } else if (fileName.endsWith('.csv')) {
      rows = await parseCSVFile(file)
    } else {
      throw new Error(`Unsupported file type: ${file.name}`)
    }

    if (rows.length === 0) {
      throw new Error('File is empty')
    }

    // Check for special formats (Wise, PayPal) first
    if (rows.length > 0) {
      const headers = rows[0].map(h => String(h))

      if (isWiseCSV(headers)) {
        const transactions = parseWiseTransactions(rows)
        if (transactions.length > 0) {
          return transactions
        }
      }

      if (isPayPalCSV(headers)) {
        const transactions = parsePayPalTransactions(rows)
        if (transactions.length > 0) {
          return transactions
        }
      }
    }

    // Auto-detect bank format if not provided
    let detectedBank = bankName
    if (!detectedBank) {
      detectedBank = detectBankFormat(rows)
      if (!detectedBank) {
        detectedBank = 'generic'
      }
    }

    const format = BANK_FORMATS[detectedBank]
    const transactions = extractTransactions(rows, format, format.name)

    return transactions
  } catch (error) {
    throw new Error(`Failed to parse bank statement: ${(error as Error).message}`)
  }
}
