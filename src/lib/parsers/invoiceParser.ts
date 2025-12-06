import { extractInvoiceDataWithRetry } from '../ai/gemini'
import { parseInvoiceCSV } from './invoiceCSVParser'

/**
 * Invoice Parser Library
 * Main entry point for parsing invoices using AI or CSV
 */

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
  date?: string
  reference?: string
}

export interface InvoiceData {
  vendor_name: string
  document_date: string
  document_type: 'invoice' | 'receipt' | 'credit_note' | 'quote' | 'other'
  document_number: string
  subtotal: number
  vat_amount: number
  vat_rate: number
  has_vat: boolean
  total_amount: number
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP'
  line_items: InvoiceLineItem[]
  extraction_confidence: number
  raw_extraction: any
}

/**
 * Parse an invoice file using AI
 * Supports both PDF and image formats
 *
 * @param fileUrl - Public URL to the invoice file
 * @param fileType - Type of file ('pdf' or 'image')
 * @returns Structured invoice data with confidence score
 */
export async function parseInvoiceWithAI(
  fileUrl: string,
  fileType: 'pdf' | 'image'
): Promise<InvoiceData> {
  try {
    // Extract data using Gemini AI with retry logic
    const geminiResult = await extractInvoiceDataWithRetry(fileUrl, fileType)

    // Transform Gemini result to InvoiceData format
    const invoiceData: InvoiceData = {
      vendor_name: geminiResult.vendor_name,
      document_date: geminiResult.document_date,
      document_type: geminiResult.document_type,
      document_number: geminiResult.document_number,
      subtotal: geminiResult.subtotal,
      vat_amount: geminiResult.vat_amount,
      vat_rate: geminiResult.vat_rate,
      has_vat: geminiResult.has_vat,
      total_amount: geminiResult.total_amount,
      currency: geminiResult.currency,
      line_items: geminiResult.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        date: item.date,
        reference: item.reference
      })),
      extraction_confidence: geminiResult.confidence,
      raw_extraction: geminiResult // Store original extraction for debugging
    }

    // Validate extracted data
    validateInvoiceData(invoiceData)

    return invoiceData
  } catch (error) {
    console.error('Invoice parsing error:', error)
    throw new Error(`Failed to parse invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate invoice data integrity
 * @param data - Invoice data to validate
 * @throws Error if validation fails
 */
function validateInvoiceData(data: InvoiceData): void {
  // Validate vendor name
  if (!data.vendor_name || data.vendor_name.trim().length === 0) {
    throw new Error('Vendor name is required')
  }

  // Validate document date format (YYYY-MM-DD)
  if (!isValidDate(data.document_date)) {
    throw new Error('Invalid document date format. Expected YYYY-MM-DD')
  }

  // Validate amounts are positive
  if (data.total_amount < 0) {
    throw new Error('Total amount cannot be negative')
  }

  if (data.subtotal < 0) {
    throw new Error('Subtotal cannot be negative')
  }

  if (data.vat_amount < 0) {
    throw new Error('VAT amount cannot be negative')
  }

  // Validate VAT consistency
  if (data.has_vat) {
    if (data.vat_amount === 0) {
      console.warn('Warning: has_vat is true but vat_amount is 0')
    }
    if (data.vat_rate === 0) {
      console.warn('Warning: has_vat is true but vat_rate is 0')
    }
  } else {
    if (data.vat_amount !== 0) {
      console.warn('Warning: has_vat is false but vat_amount is not 0')
    }
  }

  // Validate line items
  if (data.line_items.length === 0) {
    console.warn('Warning: No line items extracted from invoice')
  }

  for (const item of data.line_items) {
    if (!item.description || item.description.trim().length === 0) {
      console.warn('Warning: Line item with empty description')
    }

    if (item.quantity <= 0) {
      console.warn(`Warning: Invalid quantity for item: ${item.description}`)
    }

    if (item.amount < 0) {
      console.warn(`Warning: Negative amount for item: ${item.description}`)
    }
  }

  // Validate currency
  const validCurrencies = ['ILS', 'USD', 'EUR', 'GBP']
  if (!validCurrencies.includes(data.currency)) {
    throw new Error(`Invalid currency: ${data.currency}. Expected one of: ${validCurrencies.join(', ')}`)
  }
}

/**
 * Validate date string is in YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
function isValidDate(dateString: string): boolean {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  // Check if it's a valid date
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Note: Confidence thresholds are only used during the matching process,
 * not during initial invoice extraction. All invoices start as 'unmatched'
 * regardless of confidence score.
 */

/**
 * Format invoice data for display
 * @param invoice - Invoice data
 * @returns Formatted strings for display
 */
export function formatInvoiceForDisplay(invoice: InvoiceData) {
  return {
    vendor: invoice.vendor_name,
    date: formatDate(invoice.document_date),
    number: invoice.document_number,
    type: formatDocumentType(invoice.document_type),
    total: formatCurrency(invoice.total_amount, invoice.currency),
    subtotal: formatCurrency(invoice.subtotal, invoice.currency),
    vat: invoice.has_vat
      ? `${formatCurrency(invoice.vat_amount, invoice.currency)} (${invoice.vat_rate}%)`
      : 'No VAT',
    itemCount: invoice.line_items.length,
    confidence: `${Math.round(invoice.extraction_confidence * 100)}%`
  }
}

/**
 * Format date from YYYY-MM-DD to locale string
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format currency amount
 * @param amount - Numeric amount
 * @param currency - Currency code
 * @returns Formatted currency string
 */
function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  }

  const symbol = currencySymbols[currency] || currency
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Format document type for display
 * @param type - Document type
 * @returns Formatted type string
 */
function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'credit_note': 'Credit Note',
    'quote': 'Quote',
    'other': 'Other'
  }

  return typeMap[type] || type
}
