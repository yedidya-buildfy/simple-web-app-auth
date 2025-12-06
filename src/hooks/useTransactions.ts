import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
type InvoiceRow = Database['public']['Tables']['invoice_rows']['Row']
type InvoiceRowInsert = Database['public']['Tables']['invoice_rows']['Insert']

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  source?: string
  direction?: 'income' | 'expense' | 'transfer' | 'credit_detail'
  categoryId?: string
  businessId?: string
  amountMin?: number
  amountMax?: number
  hasInvoice?: boolean
  hasVAT?: 'yes' | 'no' | 'N/A'
  search?: string
  currency?: string
}

export interface Split {
  amount: number
  category_id?: string
  business_id?: string
  description?: string
  has_vat?: 'yes' | 'no' | 'N/A'
  vat_amount?: number
}

export interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: Error | null
  totalCount: number
  page: number
  pageSize: number
  setPage: (page: number) => void
  filters: TransactionFilters
  setFilters: (filters: TransactionFilters) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  deleteTransactions: (ids: string[]) => Promise<void>
  splitTransaction: (id: string, splits: Split[]) => Promise<void>
  linkInvoice: (transactionId: string, invoiceId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useTransactions(initialPageSize: number = 50): UseTransactionsReturn {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(initialPageSize)
  const [filters, setFilters] = useState<TransactionFilters>({})

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo)
      }
      if (filters.source) {
        query = query.eq('source', filters.source)
      }
      if (filters.direction) {
        query = query.eq('direction', filters.direction)
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.businessId) {
        query = query.eq('business_id', filters.businessId)
      }
      if (filters.amountMin !== undefined) {
        query = query.gte('amount', filters.amountMin)
      }
      if (filters.amountMax !== undefined) {
        query = query.lte('amount', filters.amountMax)
      }
      if (filters.hasInvoice !== undefined) {
        if (filters.hasInvoice) {
          query = query.not('invoice_id', 'is', null)
        } else {
          query = query.is('invoice_id', null)
        }
      }
      if (filters.hasVAT) {
        query = query.eq('has_vat', filters.hasVAT)
      }
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }
      if (filters.currency) {
        query = query.eq('currency', filters.currency)
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      // Order by date descending
      query = query.order('date', { ascending: false })

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setTransactions(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
    } finally {
      setLoading(false)
    }
  }, [user, page, pageSize, filters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as TransactionUpdate)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      await refetch()
    } catch (err) {
      console.error('Error updating transaction:', err)
      throw err
    }
  }

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      await refetch()
    } catch (err) {
      console.error('Error deleting transaction:', err)
      throw err
    }
  }

  const deleteTransactions = async (ids: string[]): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      await refetch()
    } catch (err) {
      console.error('Error deleting transactions:', err)
      throw err
    }
  }

  const splitTransaction = async (id: string, splits: Split[]): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Get original transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      if (!transaction) throw new Error('Transaction not found')

      // Validate splits sum to original amount
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0)
      if (Math.abs(totalSplitAmount - transaction.amount) > 0.01) {
        throw new Error('Split amounts must equal original transaction amount')
      }

      // If transaction has an invoice_id, create invoice_rows for splits
      if (transaction.invoice_id) {
        const invoiceRows: InvoiceRowInsert[] = splits.map(split => ({
          invoice_id: transaction.invoice_id!,
          date: transaction.date,
          description: split.description || transaction.description || '',
          quantity: 1,
          amount: split.amount,
          reference: transaction.reference,
          transaction_id: transaction.id,
          matched: true,
        }))

        const { error: insertError } = await supabase
          .from('invoice_rows')
          .insert(invoiceRows)

        if (insertError) throw insertError
      } else {
        // Create new transactions for each split
        const newTransactions: TransactionInsert[] = splits.map(split => ({
          user_id: user.id,
          file_id: transaction.file_id,
          business_id: split.business_id || transaction.business_id,
          category_id: split.category_id || transaction.category_id,
          date: transaction.date,
          source: transaction.source,
          description: split.description || transaction.description,
          amount: split.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          direction: transaction.direction,
          has_vat: split.has_vat || transaction.has_vat,
          vat_amount: split.vat_amount || 0,
          hash: `${transaction.hash}_split_${Date.now()}`,
          notes: `Split from transaction ${transaction.id}`,
        }))

        const { error: insertError } = await supabase
          .from('transactions')
          .insert(newTransactions)

        if (insertError) throw insertError

        // Delete original transaction
        await deleteTransaction(id)
      }

      await refetch()
    } catch (err) {
      console.error('Error splitting transaction:', err)
      throw err
    }
  }

  const linkInvoice = async (transactionId: string, invoiceId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      await updateTransaction(transactionId, { invoice_id: invoiceId })
    } catch (err) {
      console.error('Error linking invoice:', err)
      throw err
    }
  }

  const refetch = async (): Promise<void> => {
    await fetchTransactions()
  }

  return {
    transactions,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    setPage,
    filters,
    setFilters,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    splitTransaction,
    linkInvoice,
    refetch,
  }
}
