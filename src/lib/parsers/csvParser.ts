/**
 * Robust CSV Parser
 * Handles quotes, commas within fields, and newlines properly
 * Based on proven implementation from full-as-logic.md
 */

/**
 * Parse CSV content into array of rows
 * Handles quoted fields, escaped quotes, and newlines within fields
 */
export function parseCSVContent(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let insideQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      // Handle escaped quotes (two consecutive quotes)
      if (insideQuotes && nextChar === '"') {
        currentCell += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator (only outside quotes)
      currentRow.push(currentCell.trim())
      currentCell = ''
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      // Row separator (only outside quotes)
      currentRow.push(currentCell.trim())

      // Only add non-empty rows
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow)
      }

      currentRow = []
      currentCell = ''

      // Skip \n if we had \r\n
      if (char === '\r') i++
    } else if (char !== '\r') {
      // Add character to current cell (skip standalone \r)
      currentCell += char
    }
  }

  // Add last row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Detect delimiter used in CSV content
 */
export function detectDelimiter(content: string): ',' | ';' | '\t' {
  const firstLine = content.split('\n')[0]

  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}

/**
 * Parse CSV with custom delimiter
 */
export function parseCSVWithDelimiter(content: string, delimiter: string): string[][] {
  // Replace delimiter with comma for standard parsing
  if (delimiter !== ',') {
    content = content.replace(new RegExp(`\\${delimiter}`, 'g'), ',')
  }
  return parseCSVContent(content)
}

/**
 * Find column index by possible header names
 */
export function findColumn(headers: any[], possibleNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] || '').toString().trim().toLowerCase()
    for (const name of possibleNames) {
      if (header.includes(name.toLowerCase())) return i
    }
  }
  return -1
}

/**
 * Find header row in parsed data
 */
export function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i].join(' ').toLowerCase()

    // Look for common header keywords
    if (row.includes('date') || row.includes('תאריך')) {
      if (
        row.includes('description') || row.includes('תיאור') ||
        row.includes('amount') || row.includes('סכום') ||
        row.includes('name') || row.includes('שם')
      ) {
        return i
      }
    }
  }

  return -1
}

/**
 * Parse date from various formats
 */
export function parseDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value

  const str = value.toString().trim()

  // DD/MM/YYYY or DD/MM/YY
  let match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (match) {
    let year = parseInt(match[3])
    if (year < 100) year += 2000
    return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]))
  }

  // YYYY-MM-DD
  match = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
  }

  // M/D/YYYY format (US style)
  match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const month = parseInt(match[1])
    const day = parseInt(match[2])
    const year = parseInt(match[3])

    // Try both interpretations if ambiguous
    if (month <= 12 && day <= 12) {
      // Ambiguous - assume DD/MM/YYYY for Israeli context
      return new Date(year, month - 1, day)
    } else if (month > 12) {
      // Month is > 12, so it must be DD/MM/YYYY
      return new Date(year, day - 1, month)
    } else {
      // Day is > 12, so it must be M/D/YYYY
      return new Date(year, month - 1, day)
    }
  }

  // Try Excel serial date (number of days since 1900-01-01)
  const num = parseFloat(str)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000)
    return date
  }

  // Try standard Date parsing as last resort
  const parsedDate = new Date(str)
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate
  }

  return null
}

/**
 * Parse amount from string
 */
export function parseAmount(value: any): number {
  if (!value) return 0
  if (typeof value === 'number') return value

  let str = value.toString().trim()

  // Remove currency symbols and spaces
  str = str.replace(/[₪$€£,\s]/g, '')

  // Check for negative indicators
  const isNegative = str.includes('-') || str.includes('(')
  str = str.replace(/[-()]/g, '')

  const num = parseFloat(str) || 0
  return isNegative ? -num : num
}

/**
 * Clean string value
 */
export function cleanString(value: any): string {
  if (!value) return ''
  return value.toString().trim()
}
