import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getFileUrl } from '../lib/storage'
import { parseInvoiceWithAI } from '../lib/parsers/invoiceParser'
import { parseCreditStatement, type CreditTransaction } from '../lib/parsers/creditParser'
import { parseBankStatement, generateTransactionHash, type BankTransaction } from '../lib/parsers/bankParser'
import type { Database } from '../types/database'

type FileRow = Database['public']['Tables']['files']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceRowInsert = Database['public']['Tables']['invoice_rows']['Insert']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

/**
 * Hook for processing uploaded files
 * Handles invoice extraction, bank statement parsing, and credit card imports
 */
export function useFileProcessor() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<string>('')

  /**
   * Process a file based on its source type
   * @param fileId - ID of the file to process
   */
  const processFile = useCallback(async (fileId: string) => {
    try {
      setProcessing(true)
      setError(null)
      setProgress('Fetching file...')

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Fetch file from database
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (!file) {
        throw new Error('File not found')
      }

      // Update file status to processing
      await supabase
        .from('files')
        .update({ status: 'processing' } as any)
        .eq('id', fileId)

      // Process based on source type
      if (file.source_type === 'invoice') {
        await processInvoice(file, user.id)
      } else if (file.source_type === 'bank') {
        await processBankStatement(file, user.id)
      } else if (file.source_type === 'credit_card') {
        await processCreditCard(file, user.id)
      } else {
        throw new Error(`Unsupported source type: ${file.source_type}`)
      }

      setProgress('Processing complete')
    } catch (err) {
      console.error('File processing error:', err)
      setError(err as Error)

      // Update file status to error
      await supabase
        .from('files')
        .update({
          status: 'error',
          error_message: (err as Error).message
        } as any)
        .eq('id', fileId)

      throw err
    } finally {
      setProcessing(false)
    }
  }, [])

  /**
   * Process an invoice file using AI extraction or CSV parsing
   * @param file - File record from database
   * @param userId - Current user ID
   */
  async function processInvoice(file: FileRow, userId: string) {
    let invoiceData: any

    // Handle CSV invoices with dedicated CSV parser
    if (file.file_type === 'csv') {
      setProgress('Parsing invoice CSV...')

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('files')
        .download(file.storage_path)

      if (downloadError || !fileData) {
        throw new Error('Failed to download CSV file from storage')
      }

      // Convert blob to File object
      const fileObject = new File([fileData], file.filename, {
        type: 'text/csv'
      })

      // Import CSV parser
      const { parseInvoiceCSV } = await import('../lib/parsers/invoiceCSVParser')

      // Parse CSV
      invoiceData = await parseInvoiceCSV(fileObject)
    } else {
      // Handle PDF and image invoices with AI
      setProgress('Extracting invoice data with AI...')

      // Get file URL from storage
      const { url, error: urlError } = await getFileUrl(file.storage_path)

      if (urlError || !url) {
        throw new Error('Failed to get file URL')
      }

      // Parse invoice with AI (only PDF and image supported)
      if (file.file_type !== 'pdf' && file.file_type !== 'image') {
        throw new Error(`Unsupported file type for AI extraction: ${file.file_type}`)
      }
      invoiceData = await parseInvoiceWithAI(url, file.file_type)
    }

    setProgress('Saving invoice data...')

    // Save to invoices table (all invoices start as unmatched)
    const invoiceInsert: InvoiceInsert = {
      user_id: userId,
      file_id: file.id,
      vendor_name: invoiceData.vendor_name,
      document_date: invoiceData.document_date,
      document_type: invoiceData.document_type,
      document_number: invoiceData.document_number,
      total_amount: invoiceData.total_amount,
      subtotal: invoiceData.subtotal,
      vat_amount: invoiceData.vat_amount,
      vat_rate: invoiceData.vat_rate,
      has_vat: invoiceData.has_vat,
      currency: invoiceData.currency,
      storage_path: file.storage_path,
      extraction_confidence: invoiceData.extraction_confidence,
      raw_extraction: invoiceData.raw_extraction,
      status: 'unmatched' // Confidence only matters for matching, not initial status
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceInsert)
      .select()
      .single()

    if (invoiceError) {
      throw new Error(`Failed to save invoice: ${invoiceError.message}`)
    }

    setProgress('Saving line items...')

    // Save line items to invoice_rows table
    const lineItems: InvoiceRowInsert[] = invoiceData.line_items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
      date: item.date,
      reference: item.reference,
      matched: false
    }))

    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('invoice_rows')
        .insert(lineItems)

      if (lineItemsError) {
        throw new Error(`Failed to save line items: ${lineItemsError.message}`)
      }
    }

    // Update file status
    await supabase
      .from('files')
      .update({
        status: 'completed',
        items_count: lineItems.length,
        processed_at: new Date().toISOString()
      } as any)
      .eq('id', file.id)

    setProgress(`Invoice processed: ${lineItems.length} items, ${Math.round(invoiceData.extraction_confidence * 100)}% confidence`)
  }

  /**
   * Process a bank statement file
   * @param file - File record from database
   * @param userId - Current user ID
   */
  async function processBankStatement(file: FileRow, userId: string) {
    setProgress('Downloading bank statement...')

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(file.storage_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage')
    }

    setProgress('Parsing bank transactions...')

    // Convert blob to File object
    const fileObject = new File([fileData], file.filename, {
      type: file.file_type === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv'
    })

    // Parse bank statement
    const transactions = await parseBankStatement(fileObject)

    if (transactions.length === 0) {
      throw new Error('No transactions found in file')
    }

    setProgress(`Processing ${transactions.length} transactions...`)

    // Process transactions
    let processedCount = 0
    let duplicateCount = 0

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]

      // Update progress periodically
      if (i % 10 === 0) {
        setProgress(`Processing transaction ${i + 1}/${transactions.length}...`)
      }

      const hash = generateTransactionHash(tx)

      // Check for duplicates
      const existingId = await checkDuplicate(hash, userId)
      if (existingId) {
        await saveDuplicateBankTransaction(existingId, hash, userId, file.id, tx)
        duplicateCount++
        continue
      }

      // Insert transaction
      const transactionData: TransactionInsert = {
        user_id: userId,
        file_id: file.id,
        date: tx.date.toISOString().split('T')[0],
        source: tx.source,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        reference: tx.reference || null,
        direction: tx.direction,
        hash,
        has_vat: 'N/A',
        vat_amount: 0,
        notes: null
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionData as any)

      if (insertError) {
        throw new Error(`Failed to insert bank transaction ${i + 1}/${transactions.length}: ${insertError.message}`)
      }

      processedCount++
    }

    // Update file status
    await supabase
      .from('files')
      .update({
        status: 'completed',
        items_count: processedCount,
        processed_at: new Date().toISOString()
      } as any)
      .eq('id', file.id)

    setProgress(`Bank statement processed: ${processedCount} transactions (${duplicateCount} duplicates skipped)`)
  }

  /**
   * Check for duplicate transaction
   */
  async function checkDuplicate(hash: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('hash', hash)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking duplicate:', error)
      return null
    }

    return data?.id || null
  }

  /**
   * Save duplicate bank transaction
   */
  async function saveDuplicateBankTransaction(
    originalId: string,
    hash: string,
    userId: string,
    fileId: string,
    tx: BankTransaction
  ): Promise<void> {
    try {
      await supabase.from('duplicates').insert({
        user_id: userId,
        original_transaction_id: originalId,
        hash,
        source_file: fileId,
        date: tx.date.toISOString().split('T')[0],
        source: tx.source,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency
      } as any)
    } catch (error) {
      console.error('Error saving duplicate:', error)
    }
  }

  /**
   * Generate hash for duplicate detection (credit transactions)
   */
  function generateCreditTransactionHash(
    date: Date,
    source: string,
    amount: number,
    description: string
  ): string {
    const data = `${date.toISOString().split('T')[0]}-${source}-${amount}-${description}`
    // Simple hash function for browser compatibility
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Check if transaction is duplicate
   */
  async function isDuplicate(hash: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('hash', hash)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking duplicate:', error)
      return false
    }

    return !!data
  }

  /**
   * Save duplicate to duplicates table
   */
  async function saveDuplicate(
    hash: string,
    userId: string,
    fileId: string,
    tx: CreditTransaction
  ): Promise<void> {
    try {
      await supabase.from('duplicates').insert({
        user_id: userId,
        hash,
        source_file: fileId,
        date: tx.date.toISOString(),
        source: tx.source,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency
      })
    } catch (error) {
      console.error('Error saving duplicate:', error)
    }
  }

  /**
   * Process a credit card statement file
   * @param file - File record from database
   * @param userId - Current user ID
   */
  async function processCreditCard(file: FileRow, userId: string) {
    setProgress('Downloading credit card statement...')

    // Get file URL for PDF parsing (if needed)
    const { url: fileUrl, error: urlError } = await getFileUrl(file.storage_path)

    if (urlError || !fileUrl) {
      throw new Error(`Failed to get file URL: ${urlError?.message || 'Unknown error'}`)
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(file.storage_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage')
    }

    setProgress('Parsing credit card transactions...')

    // Determine MIME type based on file_type
    let mimeType = 'text/csv'
    if (file.file_type === 'excel') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (file.file_type === 'pdf') {
      mimeType = 'application/pdf'
    }

    // Convert blob to File object
    const fileObject = new File([fileData], file.filename, {
      type: mimeType
    })

    // Parse credit card statement
    const transactions = await parseCreditStatement(
      fileObject,
      undefined, // Auto-detect provider
      userId,
      fileUrl || undefined // Pass URL for PDF parsing
    )

    if (transactions.length === 0) {
      throw new Error('No transactions found in file')
    }

    setProgress(`Processing ${transactions.length} transactions...`)

    // Process transactions
    let processedCount = 0
    let duplicateCount = 0

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]

      // Update progress periodically
      if (i % 10 === 0) {
        setProgress(`Processing transaction ${i + 1}/${transactions.length}...`)
      }

      const hash = generateCreditTransactionHash(
        tx.date,
        tx.source,
        tx.amount,
        tx.description
      )

      // Check for duplicates
      if (await isDuplicate(hash, userId)) {
        await saveDuplicate(hash, userId, file.id, tx)
        duplicateCount++
        continue
      }

      // Insert transaction
      const transactionData: TransactionInsert = {
        user_id: userId,
        file_id: file.id,
        date: tx.date.toISOString(),
        source: tx.source,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        reference: tx.reference,
        direction: tx.direction,
        hash,
        has_vat: 'N/A',
        vat_amount: 0,
        notes: tx.installmentNumber
          ? `Installment ${tx.installmentNumber}/${tx.installments}`
          : null
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionData as any)

      if (insertError) {
        throw new Error(`Failed to insert credit transaction ${i + 1}/${transactions.length}: ${insertError.message}`)
      }

      processedCount++
    }

    // Update file status
    await supabase
      .from('files')
      .update({
        status: 'completed',
        items_count: processedCount,
        processed_at: new Date().toISOString()
      } as any)
      .eq('id', file.id)

    setProgress(`Credit card processed: ${processedCount} transactions (${duplicateCount} duplicates skipped)`)
  }

  /**
   * Batch process multiple files in parallel with concurrency limit
   * @param fileIds - Array of file IDs to process
   * @param concurrency - Maximum number of files to process at once (default: 3)
   */
  const processBatch = useCallback(async (fileIds: string[], concurrency: number = 3) => {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ fileId: string; error: string; filename?: string }>,
      successfulFiles: [] as Array<{ fileId: string; filename?: string }>
    }

    // Process files in batches with limited concurrency
    const batchSize = concurrency
    const totalFiles = fileIds.length
    let processedCount = 0

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize)

      // Update progress for batch
      setProgress(`Processing batch ${Math.floor(i / batchSize) + 1} (files ${i + 1}-${Math.min(i + batchSize, totalFiles)} of ${totalFiles})...`)

      // Process batch in parallel
      const batchPromises = batch.map(async (fileId) => {
        try {
          // Get file info for better error reporting
          const { data: file } = await supabase
            .from('files')
            .select('filename')
            .eq('id', fileId)
            .single()

          await processFile(fileId)

          processedCount++
          results.successful++
          results.successfulFiles.push({
            fileId,
            filename: file?.filename
          })

          // Update progress after each file completes
          setProgress(`Processed ${processedCount}/${totalFiles} files (${results.successful} successful, ${results.failed} failed)`)

          return { success: true, fileId, filename: file?.filename }
        } catch (err) {
          processedCount++
          results.failed++

          // Get file info for error reporting
          const { data: file } = await supabase
            .from('files')
            .select('filename')
            .eq('id', fileId)
            .maybeSingle()

          const error = {
            fileId,
            filename: file?.filename,
            error: (err as Error).message
          }

          results.errors.push(error)

          // Update progress after each file completes
          setProgress(`Processed ${processedCount}/${totalFiles} files (${results.successful} successful, ${results.failed} failed)`)

          return { success: false, fileId, filename: file?.filename, error: (err as Error).message }
        }
      })

      // Wait for all files in this batch to complete
      await Promise.all(batchPromises)
    }

    setProgress(`Batch complete: ${results.successful} successful, ${results.failed} failed out of ${totalFiles} files`)

    return results
  }, [processFile])

  /**
   * Extract invoice data without saving (for review modal)
   * @param fileId - ID of the file to extract
   * @returns Extracted invoice data
   */
  const extractInvoiceOnly = useCallback(async (fileId: string) => {
    try {
      setProcessing(true)
      setError(null)
      setProgress('Fetching file...')

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Fetch file from database
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (!file) {
        throw new Error('File not found')
      }

      if (file.source_type !== 'invoice') {
        throw new Error('Only invoice files can be reviewed before saving')
      }

      // Update file status to processing
      await supabase
        .from('files')
        .update({ status: 'processing' })
        .eq('id', fileId)

      let invoiceData: any

      // Handle CSV invoices with dedicated CSV parser
      if (file.file_type === 'csv') {
        setProgress('Parsing invoice CSV...')

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('files')
          .download(file.storage_path)

        if (downloadError || !fileData) {
          throw new Error('Failed to download CSV file from storage')
        }

        const fileObject = new File([fileData], file.filename, {
          type: 'text/csv'
        })

        const { parseInvoiceCSV } = await import('../lib/parsers/invoiceCSVParser')
        invoiceData = await parseInvoiceCSV(fileObject)
      } else {
        // Handle PDF and image invoices with AI
        setProgress('Extracting invoice data with AI...')

        const { url, error: urlError } = await getFileUrl(file.storage_path)

        if (urlError || !url) {
          throw new Error('Failed to get file URL')
        }

        invoiceData = await parseInvoiceWithAI(url, file.file_type)
      }

      setProgress('Invoice extracted, ready for review')

      // Return invoice data without saving
      return {
        ...invoiceData,
        fileId: file.id,
        filename: file.filename
      }
    } catch (err) {
      console.error('Invoice extraction error:', err)
      setError(err as Error)

      // Revert file status to pending on error
      await supabase
        .from('files')
        .update({ status: 'pending' })
        .eq('id', fileId)

      throw err
    } finally {
      setProcessing(false)
    }
  }, [])

  /**
   * Save invoice after review
   * @param fileId - ID of the file
   * @param invoiceData - Reviewed and possibly edited invoice data
   */
  const saveInvoiceAfterReview = useCallback(async (fileId: string, invoiceData: any) => {
    try {
      setProcessing(true)
      setError(null)
      setProgress('Saving invoice...')

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Fetch file from database
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError || !file) {
        throw new Error('File not found')
      }

      // Save to invoices table (no status based on confidence)
      const invoiceInsert: InvoiceInsert = {
        user_id: user.id,
        file_id: file.id,
        vendor_name: invoiceData.vendor_name,
        document_date: invoiceData.document_date,
        document_type: invoiceData.document_type,
        document_number: invoiceData.document_number,
        total_amount: invoiceData.total_amount,
        subtotal: invoiceData.subtotal,
        vat_amount: invoiceData.vat_amount,
        vat_rate: invoiceData.vat_rate,
        has_vat: invoiceData.has_vat,
        currency: invoiceData.currency,
        storage_path: file.storage_path,
        extraction_confidence: invoiceData.extraction_confidence,
        raw_extraction: invoiceData.raw_extraction,
        status: 'unmatched' // Always start as unmatched, confidence only matters for matching
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsert)
        .select()
        .single()

      if (invoiceError) {
        throw new Error(`Failed to save invoice: ${invoiceError.message}`)
      }

      setProgress('Saving line items...')

      // Save line items to invoice_rows table
      const lineItems: InvoiceRowInsert[] = invoiceData.line_items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        date: item.date,
        reference: item.reference,
        matched: false
      }))

      if (lineItems.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('invoice_rows')
          .insert(lineItems)

        if (lineItemsError) {
          throw new Error(`Failed to save line items: ${lineItemsError.message}`)
        }
      }

      // Update file status
      await supabase
        .from('files')
        .update({
          status: 'completed',
          items_count: lineItems.length,
          processed_at: new Date().toISOString()
        })
        .eq('id', file.id)

      setProgress('Invoice saved successfully')
    } catch (err) {
      console.error('Save invoice error:', err)
      setError(err as Error)
      throw err
    } finally {
      setProcessing(false)
    }
  }, [])

  return {
    processFile,
    processBatch,
    processing,
    error,
    progress
  }
}
