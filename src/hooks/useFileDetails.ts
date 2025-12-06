import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getFileUrl } from '../lib/storage'
import type { Database } from '../types/database'

type FileRow = Database['public']['Tables']['files']['Row']
type TransactionRow = Database['public']['Tables']['transactions']['Row']
type InvoiceRow = Database['public']['Tables']['invoices']['Row']
type InvoiceLineRow = Database['public']['Tables']['invoice_rows']['Row']

interface InvoiceWithRows extends InvoiceRow {
  invoice_rows: InvoiceLineRow[]
}

export interface FileDetailsData {
  file: FileRow | null
  fileUrl: string | null
  rows: TransactionRow[] | InvoiceWithRows[] | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to fetch file details and associated data
 */
export function useFileDetails(fileId: string | null) {
  const [data, setData] = useState<FileDetailsData>({
    file: null,
    fileUrl: null,
    rows: null,
    loading: false,
    error: null
  })

  useEffect(() => {
    if (!fileId) {
      setData({ file: null, fileUrl: null, rows: null, loading: false, error: null })
      return
    }

    let mounted = true

    const fetchFileDetails = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // 1. Fetch file metadata
        const { data: file, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single()

        if (fileError) throw fileError
        if (!mounted) return

        // 2. Get signed URL for file preview
        let fileUrl: string | null = null
        if (file.storage_path) {
          const { url, error: urlError } = await getFileUrl(file.storage_path)
          if (!urlError && url) {
            fileUrl = url
          }
        }

        // 3. Fetch associated data if file is processed
        let rows: TransactionRow[] | InvoiceWithRows[] | null = null

        if (file.status === 'completed') {
          if (file.source_type === 'bank' || file.source_type === 'credit_card') {
            // Fetch transactions
            const { data: transactions, error: txError } = await supabase
              .from('transactions')
              .select('*')
              .eq('file_id', fileId)
              .order('date', { ascending: false })

            if (txError) throw txError
            rows = transactions as TransactionRow[]
          } else if (file.source_type === 'invoice') {
            // Fetch invoices with line items
            const { data: invoices, error: invError } = await supabase
              .from('invoices')
              .select('*, invoice_rows(*)')
              .eq('file_id', fileId)

            if (invError) throw invError
            rows = invoices as InvoiceWithRows[]
          }
        }

        if (!mounted) return

        setData({
          file,
          fileUrl,
          rows,
          loading: false,
          error: null
        })
      } catch (err) {
        if (!mounted) return
        setData(prev => ({
          ...prev,
          loading: false,
          error: err as Error
        }))
      }
    }

    fetchFileDetails()

    return () => {
      mounted = false
    }
  }, [fileId])

  /**
   * Refresh data after mutations
   */
  const refresh = async () => {
    if (!fileId) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Re-fetch everything
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fileError) throw fileError

      let rows: TransactionRow[] | InvoiceWithRows[] | null = null

      if (file.status === 'completed') {
        if (file.source_type === 'bank' || file.source_type === 'credit_card') {
          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('file_id', fileId)
            .order('date', { ascending: false })

          if (txError) throw txError
          rows = transactions as TransactionRow[]
        } else if (file.source_type === 'invoice') {
          const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('*, invoice_rows(*)')
            .eq('file_id', fileId)

          if (invError) throw invError
          rows = invoices as InvoiceWithRows[]
        }
      }

      setData(prev => ({
        ...prev,
        file,
        rows,
        loading: false,
        error: null
      }))
    } catch (err) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: err as Error
      }))
    }
  }

  return {
    ...data,
    refresh
  }
}

/**
 * Hook for updating a transaction
 */
export function useUpdateTransaction() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateTransaction = async (
    transactionId: string,
    updates: Partial<TransactionRow>
  ): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (updateError) throw updateError

      setUpdating(false)
      return true
    } catch (err) {
      setError(err as Error)
      setUpdating(false)
      return false
    }
  }

  return { updateTransaction, updating, error }
}

/**
 * Hook for deleting a transaction
 */
export function useDeleteTransaction() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      setDeleting(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (deleteError) throw deleteError

      setDeleting(false)
      return true
    } catch (err) {
      setError(err as Error)
      setDeleting(false)
      return false
    }
  }

  return { deleteTransaction, deleting, error }
}

/**
 * Hook for updating an invoice line item
 */
export function useUpdateInvoiceRow() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateInvoiceRow = async (
    rowId: string,
    updates: Partial<InvoiceLineRow>
  ): Promise<boolean> => {
    try {
      setUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('invoice_rows')
        .update(updates)
        .eq('id', rowId)

      if (updateError) throw updateError

      setUpdating(false)
      return true
    } catch (err) {
      setError(err as Error)
      setUpdating(false)
      return false
    }
  }

  return { updateInvoiceRow, updating, error }
}

/**
 * Hook for deleting an invoice line item
 */
export function useDeleteInvoiceRow() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteInvoiceRow = async (rowId: string): Promise<boolean> => {
    try {
      setDeleting(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('invoice_rows')
        .delete()
        .eq('id', rowId)

      if (deleteError) throw deleteError

      setDeleting(false)
      return true
    } catch (err) {
      setError(err as Error)
      setDeleting(false)
      return false
    }
  }

  return { deleteInvoiceRow, deleting, error }
}
