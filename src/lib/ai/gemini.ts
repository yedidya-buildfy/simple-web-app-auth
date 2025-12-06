import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Gemini AI Integration for Invoice Data Extraction
 * Uses Google's Gemini Flash models with fallback for rate limiting
 */

export interface GeminiExtractionResult {
  vendor_name: string
  document_date: string
  document_type: 'invoice' | 'receipt' | 'credit_note' | 'quote' | 'other'
  document_number: string
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP'
  subtotal: number
  vat_rate: number
  vat_amount: number
  has_vat: boolean
  total_amount: number
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
    date?: string
    reference?: string
  }>
  confidence: number
}

/**
 * Extract invoice data from a file URL using Gemini AI with model fallback
 * @param fileUrl - Public URL to the invoice file
 * @param fileType - Type of file (pdf or image)
 * @returns Extracted invoice data with confidence score
 */
export async function extractInvoiceData(
  fileUrl: string,
  fileType: 'pdf' | 'image'
): Promise<GeminiExtractionResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Try models in order: latest -> lite fallback
  const modelNames = ['gemini-flash-latest', 'gemini-flash-lite-latest']
  let lastError: any = null

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })

      const prompt = `
You are an invoice data extraction expert. Extract structured data from this ${fileType}.

Return JSON with this exact structure:
{
  "vendor_name": "Company Name",
  "document_date": "YYYY-MM-DD",
  "document_type": "invoice|receipt|credit_note|quote|other",
  "document_number": "INV-12345",
  "currency": "ILS|USD|EUR|GBP",
  "subtotal": 1000.00,
  "vat_rate": 17,
  "vat_amount": 170.00,
  "has_vat": true,
  "total_amount": 1170.00,
  "line_items": [
    {
      "description": "Product/Service description",
      "quantity": 1,
      "unit_price": 1000.00,
      "amount": 1000.00,
      "date": "YYYY-MM-DD" (optional),
      "reference": "REF-123" (optional)
    }
  ],
  "confidence": 0.95
}

IMPORTANT:
- All amounts as numbers (not strings)
- Dates in YYYY-MM-DD format
- VAT rate as percentage (17 not 0.17)
- If no VAT, set has_vat: false, vat_amount: 0, vat_rate: 0
- Hebrew text is OK, keep vendor names in original language
- If unsure, set confidence lower
- For Israeli invoices, typical VAT rate is 17%
- Extract ALL line items found in the document
- If subtotal is not shown, calculate from line items
- Return ONLY valid JSON, no explanations
`

      // Fetch file as base64
      const base64Data = await fetchFileAsBase64(fileUrl)

      // Determine MIME type
      const mimeType = getMimeType(fileType, fileUrl)

      // Generate content with Gemini (with timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout after 2 minutes')), 120000)
      )

      const result = await Promise.race([
        model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]),
        timeoutPromise
      ]) as any

      const response = result.response.text()
      const cleanedResponse = cleanJSONResponse(response)

      // Parse and validate the JSON response
      const extractedData = JSON.parse(cleanedResponse)

      // Validate required fields
      validateExtractionResult(extractedData)

      console.log(`✅ Successfully used model: ${modelName}`)
      return extractedData

    } catch (error) {
      lastError = error
      console.warn(`❌ Model ${modelName} failed, trying next...`, error)

      // Check if it's a rate limit error - if so, try next model
      const errorStr = JSON.stringify(error)
      const isRateLimit = errorStr.includes('"status":429') || errorStr.includes('RESOURCE_EXHAUSTED')

      if (!isRateLimit) {
        // If it's not a rate limit error, don't try other models
        break
      }

      // Continue to next model
      continue
    }
  }

  // If all models failed, throw the last error
  console.error('Gemini extraction error:', lastError)
  console.error('Error details:', JSON.stringify(lastError, null, 2))

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError)
  const errorStr = JSON.stringify(lastError)

  // Check for rate limiting (429 status code)
  if (errorStr.includes('"status":429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Gemini API rate limit exceeded on all models. Please try again in a few moments.')
  }

  // Check for invalid API key
  if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
    throw new Error('Invalid Gemini API key. Please check your configuration.')
  }

  // Check for quota exceeded
  if (errorMessage.includes('quota') || errorStr.includes('QUOTA_EXCEEDED')) {
    throw new Error('Gemini API quota exceeded. Check your Google Cloud Console.')
  }

  // Return the actual error message for debugging
  throw new Error(`Failed to extract invoice data: ${errorMessage}`)
}

/**
 * Fetch a file from URL and convert to base64
 * @param url - Public URL of the file
 * @returns Base64 encoded string
 */
async function fetchFileAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = () => {
        reject(new Error('Failed to convert file to base64'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw new Error(`Failed to fetch and encode file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Determine MIME type based on file type and URL
 * @param fileType - pdf or image
 * @param fileUrl - URL of the file
 * @returns MIME type string
 */
function getMimeType(fileType: 'pdf' | 'image', fileUrl: string): string {
  if (fileType === 'pdf') {
    return 'application/pdf'
  }

  // Determine image type from URL
  const urlLower = fileUrl.toLowerCase()
  if (urlLower.endsWith('.png')) {
    return 'image/png'
  } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
    return 'image/jpeg'
  }

  // Default to jpeg for images
  return 'image/jpeg'
}

/**
 * Clean Gemini response to extract valid JSON
 * Removes markdown code blocks and extra whitespace
 * @param text - Raw text response from Gemini
 * @returns Cleaned JSON string
 */
function cleanJSONResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  // Trim whitespace
  cleaned = cleaned.trim()

  // Try to find JSON object if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  return cleaned
}

/**
 * Validate extraction result has required fields
 * @param data - Extracted data object
 * @throws Error if validation fails
 */
function validateExtractionResult(data: any): void {
  const requiredFields = [
    'vendor_name',
    'document_date',
    'document_type',
    'document_number',
    'currency',
    'subtotal',
    'vat_rate',
    'vat_amount',
    'has_vat',
    'total_amount',
    'line_items',
    'confidence'
  ]

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate line items structure
  if (!Array.isArray(data.line_items)) {
    throw new Error('line_items must be an array')
  }

  // Validate confidence is between 0 and 1
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    throw new Error('confidence must be a number between 0 and 1')
  }
}

/**
 * Retry extraction with exponential backoff
 * @param fileUrl - Public URL to the invoice file
 * @param fileType - Type of file (pdf or image)
 * @param maxRetries - Maximum number of retry attempts
 * @returns Extracted invoice data
 */
export async function extractInvoiceDataWithRetry(
  fileUrl: string,
  fileType: 'pdf' | 'image',
  maxRetries: number = 3
): Promise<GeminiExtractionResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await extractInvoiceData(fileUrl, fileType)
    } catch (error) {
      lastError = error as Error

      // Don't retry on validation errors or API key errors
      if (
        lastError.message.includes('Invalid Gemini API key') ||
        lastError.message.includes('Missing required field')
      ) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Failed to extract invoice data after retries')
}
