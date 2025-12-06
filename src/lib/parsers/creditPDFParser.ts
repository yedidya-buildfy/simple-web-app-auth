/**
 * Credit Card PDF Parser using Gemini AI
 * Handles credit card statements in PDF format (Cal, Isracard, etc.)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CreditTransaction } from './creditParser'
import { parseDate, parseAmount } from './csvParser'

interface GeminiCreditTransaction {
  date: string
  businessName: string
  amount: number
  currency: string
  reference?: string
}

/**
 * Parse credit card PDF using Gemini AI with model fallback
 */
export async function parseCreditCardPDF(
  fileUrl: string,
  cardProvider: string = 'Credit Card'
): Promise<CreditTransaction[]> {
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

      const prompt = `You are analyzing a credit card statement PDF (${cardProvider}).

Extract ALL transactions from the tables in the file and return them in JSON format ONLY.

Credit card statements typically have two types of tables:
1. "Accumulated Transactions" - transactions in local currency (ILS)
2. "Future Charges" - transactions in foreign currency (USD/EUR/GBP)

For each transaction, return:
- date: Transaction date in DD/MM/YYYY format
- businessName: Merchant/business name
- amount: Amount (number only, no currency symbol)
- currency: Currency code (ILS, USD, EUR, or GBP)
- reference: Reference number/ID if available (optional)

Ignore summary rows, advertisements, and interest charges.

Return ONLY JSON array (no markdown formatting):
[{"date": "20/10/2025", "businessName": "Business Name", "amount": 123.45, "currency": "ILS", "reference": ""}]

IMPORTANT:
- Extract ALL transactions, even small ones
- Keep business names in original language (Hebrew is OK)
- Amount should be positive numbers
- Date must be in DD/MM/YYYY format
- Return empty array [] if no transactions found`

      // Fetch PDF file as base64
      const base64Data = await fetchFileAsBase64(fileUrl)

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
              mimeType: 'application/pdf'
            }
          }
        ]),
        timeoutPromise
      ]) as any

      const response = result.response.text()
      const cleanedResponse = cleanJSONResponse(response)

      // Parse JSON response
      let rawTransactions: GeminiCreditTransaction[]
      try {
        rawTransactions = JSON.parse(cleanedResponse)
      } catch (e) {
        throw new Error(`Failed to parse Gemini response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }

      if (!Array.isArray(rawTransactions)) {
        throw new Error('Gemini response is not an array')
      }

      // Convert to CreditTransaction format
      const transactions: CreditTransaction[] = []

      for (const raw of rawTransactions) {
        if (!raw.date || !raw.businessName || !raw.amount) {
          continue // Skip invalid entries
        }

        const date = parseDate(raw.date)
        if (!date) {
          console.warn(`Invalid date: ${raw.date}`)
          continue
        }

        const amount = typeof raw.amount === 'number' ? raw.amount : parseAmount(String(raw.amount))
        const currency = (raw.currency || 'ILS').toUpperCase()

        transactions.push({
          date,
          source: cardProvider,
          description: raw.businessName,
          amount: Math.abs(amount),
          currency: currency as 'ILS' | 'USD' | 'EUR' | 'GBP',
          reference: raw.reference || '',
          direction: 'expense',
          business: raw.businessName
        })
      }

      console.log(`✅ Successfully used model: ${modelName}`)
      return transactions

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
  console.error('Credit card PDF parsing error:', lastError)
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
  throw new Error(`Failed to parse credit card PDF: ${errorMessage}`)
}

/**
 * Fetch a file from URL and convert to base64
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
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
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
 * Clean Gemini response to extract valid JSON
 */
function cleanJSONResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  // Trim whitespace
  cleaned = cleaned.trim()

  // Try to find JSON array if there's extra text
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  return cleaned
}

/**
 * Parse credit card PDF with retry logic
 */
export async function parseCreditCardPDFWithRetry(
  fileUrl: string,
  cardProvider: string = 'Credit Card',
  maxRetries: number = 3
): Promise<CreditTransaction[]> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await parseCreditCardPDF(fileUrl, cardProvider)
    } catch (error) {
      lastError = error as Error

      // Don't retry on API key errors
      if (lastError.message.includes('Invalid Gemini API key')) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Failed to parse credit card PDF after retries')
}
