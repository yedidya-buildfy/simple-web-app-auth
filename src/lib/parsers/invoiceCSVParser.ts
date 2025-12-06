/**
 * Invoice CSV Parser
 * Handles Meta/Facebook invoice CSV format and generic invoice CSVs
 */

import {
  parseCSVContent,
  findColumn,
  parseDate,
  parseAmount,
  cleanString
} from './csvParser'
import type { InvoiceData, InvoiceLineItem } from './invoiceParser'

/**
 * Detect if CSV is Meta/Facebook invoice format
 */
function isMetaInvoiceCSV(rows: string[][]): boolean {
  if (rows.length < 3) return false

  // Meta invoices have "Meta information" header and specific structure
  const firstRow = rows[0].join(',').toLowerCase()
  if (firstRow.includes('meta information')) {
    return true
  }

  // Check for Meta-specific headers
  const content = rows.slice(0, 10).map(r => r.join(',')).join(' ').toLowerCase()
  return content.includes('meta platforms') ||
         content.includes('advertiser information') ||
         (content.includes('billing report') && content.includes('meta ads payment'))
}

/**
 * Parse Meta/Facebook invoice CSV
 */
export function parseMetaInvoiceCSV(rows: string[][]): InvoiceData | null {
  if (rows.length < 5) return null

  // Extract vendor info from first few rows
  let vendorName = 'Meta Platforms Ireland Limited'
  let accountInfo = ''
  let businessInfo = ''
  let billingPeriod = ''

  // Parse header section
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowText = rows[i].join(',')

    if (rowText.includes('Meta Platforms')) {
      vendorName = rows[i][0] || vendorName
    }

    if (rowText.includes('Account:')) {
      accountInfo = rowText
    }

    if (rowText.includes('Business:')) {
      businessInfo = rows[i][1] || ''
    }

    if (rowText.includes('Billing Report:')) {
      billingPeriod = rows[i][0].replace('Billing Report:', '').trim()
    }
  }

  // Find the transaction data header row
  let dataHeaderRow = -1
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].join(',').toLowerCase()
    if (row.includes('date') && row.includes('transaction') && row.includes('amount')) {
      dataHeaderRow = i
      break
    }
  }

  if (dataHeaderRow === -1) {
    return null
  }

  const headers = rows[dataHeaderRow]
  const lineItems: InvoiceLineItem[] = []
  let totalAmount = 0

  const colMap = {
    date: findColumn(headers, ['Date', 'תאריך']),
    transactionId: findColumn(headers, ['Transaction ID', 'מזהה עסקה']),
    amount: findColumn(headers, ['Amount', 'סכום']),
    currency: findColumn(headers, ['Currency', 'מטבע'])
  }

  // Extract transactions
  for (let i = dataHeaderRow + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 2) continue

    const dateStr = row[colMap.date]
    const transactionId = row[colMap.transactionId] || ''
    const amountStr = row[colMap.amount]
    const currency = row[colMap.currency] || 'USD'

    if (!dateStr || !amountStr) continue

    const date = parseDate(dateStr)
    const amount = parseAmount(amountStr)

    if (!date || amount === 0) continue

    totalAmount += amount

    lineItems.push({
      description: `Meta Ads Payment - ${transactionId}`,
      quantity: 1,
      unit_price: amount,
      amount: amount,
      date: date.toISOString().split('T')[0],
      reference: transactionId
    })
  }

  if (lineItems.length === 0) {
    return null
  }

  // Extract document date from billing period or first transaction
  let documentDate = new Date()
  if (billingPeriod) {
    // Try to parse "1/1/2025 - 2/1/2025" format - use end date
    const dateMatch = billingPeriod.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dateMatch) {
      documentDate = parseDate(dateMatch[0]) || documentDate
    }
  } else if (lineItems.length > 0 && lineItems[0].date) {
    documentDate = new Date(lineItems[0].date)
  }

  return {
    vendor_name: businessInfo || vendorName,
    document_date: documentDate.toISOString().split('T')[0],
    document_type: 'invoice',
    document_number: `META-${billingPeriod.replace(/[^0-9]/g, '')}` || `META-${Date.now()}`,
    subtotal: totalAmount,
    vat_amount: 0,
    vat_rate: 0,
    has_vat: false,
    total_amount: totalAmount,
    currency: lineItems[0] ? 'USD' : 'ILS', // Meta typically uses USD
    line_items: lineItems,
    extraction_confidence: 0.95, // High confidence for structured CSV
    raw_extraction: {
      vendor_name: vendorName,
      account_info: accountInfo,
      business_info: businessInfo,
      billing_period: billingPeriod
    }
  }
}

/**
 * Parse generic invoice CSV
 */
export function parseGenericInvoiceCSV(rows: string[][]): InvoiceData | null {
  if (rows.length < 2) return null

  // Find header row
  let headerRow = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i].join(',').toLowerCase()
    if (row.includes('date') || row.includes('תאריך')) {
      if (row.includes('amount') || row.includes('סכום') ||
          row.includes('description') || row.includes('תיאור')) {
        headerRow = i
        break
      }
    }
  }

  if (headerRow === -1) {
    headerRow = 0 // Assume first row is header
  }

  const headers = rows[headerRow]
  const lineItems: InvoiceLineItem[] = []

  const colMap = {
    date: findColumn(headers, ['Date', 'תאריך', 'date']),
    amount: findColumn(headers, ['Amount', 'סכום', 'Total', 'amount', 'סה"כ']),
    description: findColumn(headers, ['Description', 'תיאור', 'Name', 'description', 'פירוט']),
    reference: findColumn(headers, ['Reference', 'אסמכתא', 'ID', 'Transaction', 'מספר']),
    quantity: findColumn(headers, ['Quantity', 'כמות', 'Qty']),
    unitPrice: findColumn(headers, ['Unit Price', 'מחיר יחידה', 'Price']),
    vat: findColumn(headers, ['VAT', 'מע"מ', 'מעמ'])
  }

  if (colMap.date === -1 || colMap.amount === -1) {
    return null
  }

  let totalAmount = 0
  let totalVat = 0
  const currency = 'ILS' // Default currency

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 2) continue

    const date = parseDate(row[colMap.date])
    const amount = parseAmount(row[colMap.amount])

    if (!date || amount === 0) continue

    const description = colMap.description >= 0 ? cleanString(row[colMap.description]) : `Item ${i - headerRow}`
    const reference = colMap.reference >= 0 ? cleanString(row[colMap.reference]) : ''
    const quantity = colMap.quantity >= 0 ? parseAmount(row[colMap.quantity]) : 1
    const unitPrice = colMap.unitPrice >= 0 ? parseAmount(row[colMap.unitPrice]) : amount
    const vat = colMap.vat >= 0 ? parseAmount(row[colMap.vat]) : 0

    totalAmount += Math.abs(amount)
    totalVat += Math.abs(vat)

    lineItems.push({
      description,
      quantity: quantity || 1,
      unit_price: unitPrice,
      amount: Math.abs(amount),
      date: date.toISOString().split('T')[0],
      reference
    })
  }

  if (lineItems.length === 0) {
    return null
  }

  const hasVat = totalVat > 0
  const vatRate = hasVat ? 17 : 0 // Israeli standard VAT rate

  return {
    vendor_name: 'Invoice',
    document_date: lineItems[0].date || new Date().toISOString().split('T')[0],
    document_type: 'invoice',
    document_number: lineItems[0].reference || `INV-${Date.now()}`,
    subtotal: hasVat ? totalAmount - totalVat : totalAmount,
    vat_amount: totalVat,
    vat_rate: vatRate,
    has_vat: hasVat,
    total_amount: totalAmount,
    currency: 'ILS',
    line_items: lineItems,
    extraction_confidence: 0.8,
    raw_extraction: {}
  }
}

/**
 * Main function to parse invoice CSV
 * Automatically detects format
 */
export async function parseInvoiceCSV(file: File): Promise<InvoiceData> {
  const text = await file.text()
  const rows = parseCSVContent(text)

  if (rows.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Try Meta format first
  if (isMetaInvoiceCSV(rows)) {
    const result = parseMetaInvoiceCSV(rows)
    if (result) {
      return result
    }
  }

  // Try generic invoice format
  const result = parseGenericInvoiceCSV(rows)
  if (result) {
    return result
  }

  throw new Error('Could not parse invoice CSV - unrecognized format')
}
