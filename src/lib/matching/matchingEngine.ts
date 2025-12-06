/**
 * Matching Engine for InvoiceMatch
 * Handles automatic and manual matching of transactions to invoice rows
 */

import { supabase } from '../supabase'
import type { Database } from '../../types/database'

// Type definitions
type Transaction = Database['public']['Tables']['transactions']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceRow = Database['public']['Tables']['invoice_rows']['Row']
type MatchingRule = Database['public']['Tables']['matching_rules']['Row']

export type MatchQuality = 'exact' | 'partial_amount' | 'partial_date' | 'ai_matched'

export interface MatchResult {
  transactionId: string
  invoiceRowId: string
  matchQuality: MatchQuality
  confidence: number
}

export interface PotentialMatch {
  invoice: Invoice
  invoiceRow: InvoiceRow
  matchScore: number
  matchReasons: string[]
}

export interface MatchStatistics {
  totalTransactions: number
  totalInvoices: number
  matchedTransactions: number
  unmatchedTransactions: number
  matchedInvoices: number
  unmatchedInvoices: number
  matchRate: number
  totalMatchedAmount: number
  totalUnmatchedAmount: number
  exactMatches: number
  partialMatches: number
  aiMatches: number
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to change one string into the other
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1.length === 0) return s2.length
  if (s2.length === 0) return s1.length

  const matrix: number[][] = []

  // Initialize first column and row
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[s2.length][s1.length]
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Add days to a date
 */
function addDays(date: Date | string, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
function subtractDays(date: Date | string, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

/**
 * Calculate difference in days between two dates
 */
function differenceInDays(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get match color based on match quality
 */
export function getMatchColor(matchQuality: MatchQuality | null): string {
  if (!matchQuality) return '#6b7280' // gray

  switch (matchQuality) {
    case 'exact':
      return '#10b981' // green
    case 'partial_amount':
      return '#f59e0b' // yellow
    case 'partial_date':
      return '#f59e0b' // yellow
    case 'ai_matched':
      return '#3b82f6' // blue
    default:
      return '#6b7280' // gray
  }
}

/**
 * Find exact matches for a transaction
 * Criteria:
 * - Amount matches exactly (±0.01 for rounding)
 * - Date within ±7 days
 * - Invoice not already fully matched
 */
async function findExactMatches(
  transaction: Transaction,
  userId: string
): Promise<(InvoiceRow & { invoice: Invoice })[]> {
  const amountTolerance = 0.01
  const dateTolerance = 7 // days

  const dateStart = subtractDays(transaction.date, dateTolerance).toISOString().split('T')[0]
  const dateEnd = addDays(transaction.date, dateTolerance).toISOString().split('T')[0]
  const amountMin = transaction.amount - amountTolerance
  const amountMax = transaction.amount + amountTolerance

  const { data, error } = await supabase
    .from('invoice_rows')
    .select(`
      *,
      invoice:invoices(*)
    `)
    .gte('amount', amountMin)
    .lte('amount', amountMax)
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .eq('matched', false)
    .eq('invoices.user_id', userId)

  if (error) {
    console.error('Error finding exact matches:', error)
    return []
  }

  // Filter results where invoice exists and belongs to the user
  return (data || []).filter(row => row.invoice && row.invoice.user_id === userId) as any[]
}

/**
 * Fetch unmatched invoice rows for a user
 */
async function fetchUnmatchedInvoiceRows(
  userId: string
): Promise<(InvoiceRow & { invoice: Invoice })[]> {
  const { data, error } = await supabase
    .from('invoice_rows')
    .select(`
      *,
      invoice:invoices(*)
    `)
    .eq('matched', false)
    .eq('invoices.user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching unmatched invoice rows:', error)
    return []
  }

  return (data || []).filter(row => row.invoice) as any[]
}

/**
 * Find fuzzy matches for a transaction using scoring algorithm
 * Scoring weights:
 * - Amount similarity: 50%
 * - Date proximity: 30%
 * - Vendor name similarity: 20%
 */
export async function findFuzzyMatches(
  transaction: Transaction,
  userId: string
): Promise<PotentialMatch[]> {
  // Get all unmatched invoice rows
  const invoiceRows = await fetchUnmatchedInvoiceRows(userId)

  const matches: PotentialMatch[] = []

  for (const row of invoiceRows) {
    let score = 0
    const reasons: string[] = []

    // Amount similarity (50% weight)
    const amountDiff = Math.abs(transaction.amount - row.amount)
    const amountScore = Math.max(0, 1 - (amountDiff / Math.max(transaction.amount, row.amount)))
    score += amountScore * 50

    if (amountScore > 0.9) {
      reasons.push('Amount close match')
    } else if (amountScore > 0.7) {
      reasons.push('Amount similar')
    }

    // Date proximity (30% weight)
    if (row.date && transaction.date) {
      const daysDiff = differenceInDays(transaction.date, row.date)
      const dateScore = Math.max(0, 1 - (daysDiff / 30))
      score += dateScore * 30

      if (daysDiff <= 7) {
        reasons.push('Date within 1 week')
      } else if (daysDiff <= 14) {
        reasons.push('Date within 2 weeks')
      } else if (daysDiff <= 30) {
        reasons.push('Date within 1 month')
      }
    }

    // Vendor name similarity (20% weight)
    if (row.invoice.vendor_name && transaction.description) {
      const vendorSimilarity = stringSimilarity(
        row.invoice.vendor_name,
        transaction.description
      )
      score += vendorSimilarity * 20

      if (vendorSimilarity > 0.7) {
        reasons.push('Vendor name match')
      } else if (vendorSimilarity > 0.5) {
        reasons.push('Vendor name similar')
      }
    }

    // Only include matches with score > 50%
    if (score > 50) {
      matches.push({
        invoice: row.invoice,
        invoiceRow: row,
        matchScore: Math.round(score),
        matchReasons: reasons
      })
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Find potential matches for a specific transaction
 * Returns both exact and fuzzy matches
 */
export async function findPotentialMatches(
  transactionId: string
): Promise<PotentialMatch[]> {
  // Get transaction details
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error || !transaction) {
    console.error('Error fetching transaction:', error)
    return []
  }

  // First try exact matches
  const exactMatches = await findExactMatches(transaction, transaction.user_id)

  if (exactMatches.length > 0) {
    return exactMatches.map(row => ({
      invoice: row.invoice,
      invoiceRow: row,
      matchScore: 100,
      matchReasons: ['Exact amount and date match']
    }))
  }

  // If no exact matches, try fuzzy matching
  return findFuzzyMatches(transaction, transaction.user_id)
}

/**
 * Create a match between a transaction and an invoice row
 */
export async function createMatch(
  transactionId: string,
  invoiceRowId: string,
  matchQuality: MatchQuality
): Promise<void> {
  const matchColor = getMatchColor(matchQuality)

  // Update transaction with invoice match
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      invoice_id: invoiceRowId,
      match_quality: matchQuality,
      match_color: matchColor,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  if (transactionError) {
    throw new Error(`Failed to update transaction: ${transactionError.message}`)
  }

  // Update invoice row as matched
  const { error: invoiceRowError } = await supabase
    .from('invoice_rows')
    .update({
      transaction_id: transactionId,
      matched: true
    })
    .eq('id', invoiceRowId)

  if (invoiceRowError) {
    throw new Error(`Failed to update invoice row: ${invoiceRowError.message}`)
  }

  // Get invoice_id from invoice_row
  const { data: invoiceRow } = await supabase
    .from('invoice_rows')
    .select('invoice_id')
    .eq('id', invoiceRowId)
    .single()

  if (invoiceRow) {
    // Update invoice status and matched count
    const { data: invoice } = await supabase
      .from('invoices')
      .select('matched_transactions_count')
      .eq('id', invoiceRow.invoice_id)
      .single()

    if (invoice) {
      const newCount = (invoice.matched_transactions_count || 0) + 1

      // Check if invoice is fully matched
      const { count } = await supabase
        .from('invoice_rows')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_id', invoiceRow.invoice_id)

      const isFullyMatched = count === newCount

      await supabase
        .from('invoices')
        .update({
          matched_transactions_count: newCount,
          status: isFullyMatched ? 'matched' : 'partially_matched',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceRow.invoice_id)
    }
  }
}

/**
 * Unmatch a transaction from its invoice row
 */
export async function unmatchTransaction(transactionId: string): Promise<void> {
  // Get transaction to find associated invoice row
  const { data: transaction } = await supabase
    .from('transactions')
    .select('invoice_id')
    .eq('id', transactionId)
    .single()

  if (!transaction || !transaction.invoice_id) {
    return
  }

  const invoiceRowId = transaction.invoice_id

  // Get invoice_id before unmatching
  const { data: invoiceRow } = await supabase
    .from('invoice_rows')
    .select('invoice_id')
    .eq('id', invoiceRowId)
    .single()

  // Update transaction to remove match
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      invoice_id: null,
      match_quality: null,
      match_color: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  if (transactionError) {
    throw new Error(`Failed to unmatch transaction: ${transactionError.message}`)
  }

  // Update invoice row to mark as unmatched
  const { error: invoiceRowError } = await supabase
    .from('invoice_rows')
    .update({
      transaction_id: null,
      matched: false
    })
    .eq('id', invoiceRowId)

  if (invoiceRowError) {
    throw new Error(`Failed to unmatch invoice row: ${invoiceRowError.message}`)
  }

  // Update invoice status and matched count
  if (invoiceRow) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('matched_transactions_count')
      .eq('id', invoiceRow.invoice_id)
      .single()

    if (invoice) {
      const newCount = Math.max(0, (invoice.matched_transactions_count || 0) - 1)

      await supabase
        .from('invoices')
        .update({
          matched_transactions_count: newCount,
          status: newCount === 0 ? 'unmatched' : 'partially_matched',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceRow.invoice_id)
    }
  }
}

/**
 * Check if transaction matches rule conditions
 */
function matchesConditions(transaction: Transaction, conditions: any): boolean {
  if (!conditions) return false

  // Check description contains
  if (conditions.description_contains) {
    if (!transaction.description?.toLowerCase().includes(conditions.description_contains.toLowerCase())) {
      return false
    }
  }

  // Check amount range
  if (conditions.amount_range) {
    const min = conditions.amount_range.min ?? -Infinity
    const max = conditions.amount_range.max ?? Infinity
    if (transaction.amount < min || transaction.amount > max) {
      return false
    }
  }

  // Check direction
  if (conditions.direction) {
    if (transaction.direction !== conditions.direction) {
      return false
    }
  }

  // Check date range
  if (conditions.date_range) {
    const transactionDate = new Date(transaction.date)
    if (conditions.date_range.start) {
      const startDate = new Date(conditions.date_range.start)
      if (transactionDate < startDate) return false
    }
    if (conditions.date_range.end) {
      const endDate = new Date(conditions.date_range.end)
      if (transactionDate > endDate) return false
    }
  }

  return true
}

/**
 * Apply matching rules to a transaction
 */
async function applyMatchingRules(transaction: Transaction): Promise<void> {
  const { data: rules, error } = await supabase
    .from('matching_rules')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (error || !rules) {
    console.error('Error fetching matching rules:', error)
    return
  }

  for (const rule of rules) {
    if (matchesConditions(transaction, rule.conditions)) {
      const updates: any = {}

      // Apply category assignment
      if (rule.assign_category_id) {
        updates.category_id = rule.assign_category_id
      }

      // Apply business assignment
      if (rule.assign_business_id) {
        updates.business_id = rule.assign_business_id
      }

      // Update transaction if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()

        await supabase
          .from('transactions')
          .update(updates)
          .eq('id', transaction.id)
      }

      // Try auto-match if enabled
      if (rule.auto_match) {
        const potentialMatches = await findPotentialMatches(transaction.id)
        if (potentialMatches.length > 0 && potentialMatches[0].matchScore >= 90) {
          // Auto-match only if confidence is very high (90%+)
          await createMatch(
            transaction.id,
            potentialMatches[0].invoiceRow.id,
            potentialMatches[0].matchScore === 100 ? 'exact' : 'partial_amount'
          )
        }
      }

      // First matching rule wins
      break
    }
  }
}

/**
 * Run automatic matching for all unmatched transactions of a user
 */
export async function runAutoMatching(userId: string): Promise<MatchResult[]> {
  const results: MatchResult[] = []

  // Get all unmatched transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .is('invoice_id', null)
    .order('date', { ascending: false })

  if (error || !transactions) {
    console.error('Error fetching transactions:', error)
    return results
  }

  for (const transaction of transactions) {
    try {
      // First apply matching rules
      await applyMatchingRules(transaction)

      // Check if transaction was already matched by rules
      const { data: updatedTransaction } = await supabase
        .from('transactions')
        .select('invoice_id')
        .eq('id', transaction.id)
        .single()

      if (updatedTransaction?.invoice_id) {
        // Already matched by rule
        continue
      }

      // Try to find exact matches
      const exactMatches = await findExactMatches(transaction, userId)

      if (exactMatches.length === 1) {
        // Single exact match - auto-match
        await createMatch(transaction.id, exactMatches[0].id, 'exact')
        results.push({
          transactionId: transaction.id,
          invoiceRowId: exactMatches[0].id,
          matchQuality: 'exact',
          confidence: 100
        })
        continue
      }

      if (exactMatches.length > 1) {
        // Multiple exact matches - skip auto-match (needs manual review)
        continue
      }

      // Try fuzzy matching
      const fuzzyMatches = await findFuzzyMatches(transaction, userId)

      if (fuzzyMatches.length > 0 && fuzzyMatches[0].matchScore >= 90) {
        // High confidence fuzzy match
        await createMatch(
          transaction.id,
          fuzzyMatches[0].invoiceRow.id,
          fuzzyMatches[0].matchScore === 100 ? 'exact' : 'partial_amount'
        )
        results.push({
          transactionId: transaction.id,
          invoiceRowId: fuzzyMatches[0].invoiceRow.id,
          matchQuality: fuzzyMatches[0].matchScore === 100 ? 'exact' : 'partial_amount',
          confidence: fuzzyMatches[0].matchScore
        })
      }
    } catch (error) {
      console.error(`Error processing transaction ${transaction.id}:`, error)
    }
  }

  return results
}

/**
 * Get matching statistics for a user
 */
export async function getMatchStatistics(userId: string): Promise<MatchStatistics> {
  // Get total transactions
  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get matched transactions
  const { count: matchedTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('invoice_id', 'is', null)

  // Get match quality counts
  const { count: exactMatches } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('match_quality', 'exact')

  const { count: partialMatches } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('match_quality', ['partial_amount', 'partial_date'])

  const { count: aiMatches } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('match_quality', 'ai_matched')

  // Get total invoices
  const { count: totalInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get matched invoices
  const { count: matchedInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['matched', 'partially_matched'])

  // Calculate matched amount
  const { data: matchedTransactionsData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .not('invoice_id', 'is', null)

  const totalMatchedAmount = (matchedTransactionsData || []).reduce(
    (sum, t) => sum + t.amount,
    0
  )

  // Calculate unmatched amount
  const { data: unmatchedTransactionsData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .is('invoice_id', null)

  const totalUnmatchedAmount = (unmatchedTransactionsData || []).reduce(
    (sum, t) => sum + t.amount,
    0
  )

  const stats: MatchStatistics = {
    totalTransactions: totalTransactions || 0,
    totalInvoices: totalInvoices || 0,
    matchedTransactions: matchedTransactions || 0,
    unmatchedTransactions: (totalTransactions || 0) - (matchedTransactions || 0),
    matchedInvoices: matchedInvoices || 0,
    unmatchedInvoices: (totalInvoices || 0) - (matchedInvoices || 0),
    matchRate: totalTransactions ? Math.round(((matchedTransactions || 0) / totalTransactions) * 100) : 0,
    totalMatchedAmount: Math.round(totalMatchedAmount * 100) / 100,
    totalUnmatchedAmount: Math.round(totalUnmatchedAmount * 100) / 100,
    exactMatches: exactMatches || 0,
    partialMatches: partialMatches || 0,
    aiMatches: aiMatches || 0
  }

  return stats
}
