import { GoogleGenerativeAI } from '@google/generative-ai'
import * as XLSX from 'xlsx'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

export interface ClassificationResult {
  type: 'bank' | 'credit_card' | 'invoice'
  confidence: number
  tokens?: {
    input: number
    output: number
    total: number
  }
  cost?: number
}

/**
 * Classify document using Gemini Flash 2.5 with fallback to 2.0
 */
export async function classifyDocument(file: File): Promise<ClassificationResult> {
  console.log('🔍 [CLASSIFIER] Starting classification for file:', file.name, 'Size:', file.size, 'Type:', file.type)

  const prompt = `I want you to classify this doc and tell me is it a credit card details, bank movement or invoices (Invoices and receipts are considered invoices.)
if it have vat it probably a invoice, if it have balance it probably bank,
if its csv/xlsx only read 2 top rows
answer in one word ( credit card / bank / invoice)`

  console.log('📝 [CLASSIFIER] Using prompt:', prompt)

  // Try Gemini 2.0 Flash first (more stable)
  try {
    console.log('🚀 [CLASSIFIER] Attempting with Gemini 2.0 Flash...')
    return await classifyWithModel(file, prompt, 'gemini-2.0-flash', 'Gemini 2.0 Flash')
  } catch (error) {
    console.warn('⚠️ [CLASSIFIER] Gemini 2.0 Flash failed, trying 2.5 Flash fallback...', error)

    // Fallback to Gemini 2.5 Flash
    try {
      console.log('🚀 [CLASSIFIER] Attempting with Gemini 2.5 Flash (fallback)...')
      return await classifyWithModel(file, prompt, 'gemini-2.5-flash', 'Gemini 2.5 Flash')
    } catch (fallbackError) {
      console.error('❌ [CLASSIFIER] Both models failed:', fallbackError)

      // Final fallback - return bank with low confidence
      console.warn('⚠️ [CLASSIFIER] Falling back to default: bank (0.5 confidence)')
      return {
        type: 'bank',
        confidence: 0.5
      }
    }
  }
}

/**
 * Classify with a specific model
 */
async function classifyWithModel(
  file: File,
  prompt: string,
  modelName: string,
  modelLabel: string
): Promise<ClassificationResult> {
  const model = genAI.getGenerativeModel({ model: modelName })

  const fileType = getFileType(file)
  console.log('📄 [CLASSIFIER] Detected file type:', fileType, '| Using model:', modelLabel)

  let result: any

  if (fileType === 'pdf') {
    console.log('📑 [CLASSIFIER] Processing PDF file...')
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    console.log('✅ [CLASSIFIER] PDF converted to base64, length:', base64.length)

    console.log('🤖 [CLASSIFIER] Calling Gemini API with', modelLabel, '...')
    const startTime = Date.now()

    result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: 'application/pdf'
        }
      }
    ])

    const elapsed = Date.now() - startTime
    console.log(`✅ [CLASSIFIER] Gemini API call completed in ${elapsed}ms`)
  } else if (fileType === 'csv' || fileType === 'excel') {
    console.log('📊 [CLASSIFIER] Processing CSV/Excel file...')
    console.log('📝 [CLASSIFIER] Converting to CSV format (top 20 rows only)...')

    const csvContent = await convertToCsvTop20Rows(file)
    console.log('📝 [CLASSIFIER] CSV content (first 500 chars):', csvContent.substring(0, 500))
    console.log('📝 [CLASSIFIER] CSV total length:', csvContent.length, 'characters')

    console.log('🤖 [CLASSIFIER] Calling Gemini API with', modelLabel, '...')
    const startTime = Date.now()

    result = await model.generateContent([
      prompt,
      `\n\nFile content (CSV format):\n${csvContent}`
    ])

    const elapsed = Date.now() - startTime
    console.log(`✅ [CLASSIFIER] Gemini API call completed in ${elapsed}ms`)
  } else {
    console.error('❌ [CLASSIFIER] Unsupported file type:', fileType)
    throw new Error(`Unsupported file type: ${fileType}`)
  }

  const response = await result.response
  const text = response.text().toLowerCase().trim()
  console.log('🔍 [CLASSIFIER] Raw AI response:', text)

  // Get usage metadata
  const usageMetadata = response.usageMetadata
  if (usageMetadata) {
    const inputTokens = usageMetadata.promptTokenCount || 0
    const outputTokens = usageMetadata.candidatesTokenCount || 0
    const totalTokens = usageMetadata.totalTokenCount || inputTokens + outputTokens

    // Calculate cost (Gemini 2.0/2.5 Flash pricing)
    // 2.5 Flash: Input $0.075/1M, Output $0.30/1M
    // 2.0 Flash: Input $0.075/1M, Output $0.30/1M
    const inputCost = (inputTokens / 1_000_000) * 0.075
    const outputCost = (outputTokens / 1_000_000) * 0.30
    const totalCost = inputCost + outputCost

    console.log('💰 [CLASSIFIER] Token usage:', {
      model: modelLabel,
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      cost: `$${totalCost.toFixed(6)}`
    })

    // Parse response
    const parsed = parseOneWordResponse(text)

    return {
      ...parsed,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens
      },
      cost: totalCost
    }
  }

  // No usage metadata available
  console.log('⚠️ [CLASSIFIER] No token usage metadata available')
  return parseOneWordResponse(text)
}

/**
 * Convert CSV/Excel file to CSV format with only top 20 rows
 * NOTE: This does NOT modify the original file - it only extracts data for classification
 */
async function convertToCsvTop20Rows(file: File): Promise<string> {
  console.log('📄 [CSV CONVERTER] Reading file:', file.name)

  // Read the file
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Get first sheet
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  console.log('📄 [CSV CONVERTER] Reading sheet:', workbook.SheetNames[0])

  // Convert to 2D array
  const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
  console.log('📄 [CSV CONVERTER] Total rows in file:', data.length)

  // Get first 20 rows
  const top20Rows = data.slice(0, 20)
  console.log('📄 [CSV CONVERTER] Extracted top 20 rows (actual count:', top20Rows.length, ')')

  // Convert to CSV format
  const csvLines = top20Rows.map(row => {
    // Escape and quote each cell
    return row.map(cell => {
      // Handle null/undefined
      if (cell === null || cell === undefined) {
        return ''
      }

      // Convert to string
      const cellStr = String(cell)

      // Escape quotes and wrap in quotes if needed
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }

      return cellStr
    }).join(',')
  })

  const csvContent = csvLines.join('\n')
  console.log('📄 [CSV CONVERTER] Converted to CSV format:', csvContent.split('\n').length, 'lines')

  // IMPORTANT: Original file is NOT modified - this is just a temporary string for classification
  return csvContent
}

/**
 * Parse one-word response from Gemini
 */
function parseOneWordResponse(text: string): Omit<ClassificationResult, 'tokens' | 'cost'> {
  console.log('🔍 [PARSER] Parsing response:', text)

  // Clean the response
  const cleaned = text
    .replace(/[.,!?]/g, '')
    .replace(/\n/g, ' ')
    .toLowerCase()
    .trim()

  console.log('🔍 [PARSER] Cleaned response:', cleaned)

  // Check for keywords (order matters: check "credit card" before "credit")
  if (cleaned.includes('credit card') || (cleaned.includes('credit') && cleaned.includes('card'))) {
    console.log('✅ [PARSER] Matched: credit_card')
    return {
      type: 'credit_card',
      confidence: 0.85
    }
  }

  if (cleaned.includes('invoice')) {
    console.log('✅ [PARSER] Matched: invoice')
    return {
      type: 'invoice',
      confidence: 0.85
    }
  }

  if (cleaned.includes('bank') || cleaned.includes('movement')) {
    console.log('✅ [PARSER] Matched: bank')
    return {
      type: 'bank',
      confidence: 0.85
    }
  }

  // Default to bank if unclear
  console.warn('⚠️ [PARSER] Could not parse classification response, defaulting to bank:', text)
  return {
    type: 'bank',
    confidence: 0.5
  }
}

/**
 * Detect file type from extension
 */
function getFileType(file: File): 'pdf' | 'csv' | 'excel' | 'image' {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') return 'pdf'
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx' || ext === 'xls') return 'excel'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'image'

  return 'pdf' // Default
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
