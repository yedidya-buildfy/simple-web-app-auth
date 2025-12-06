import { useState } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Database } from '../../types/database'
import ConfirmationModal from '../ConfirmationModal'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type InvoiceLineRow = Database['public']['Tables']['invoice_rows']['Row']

interface InvoiceWithRows {
  id: string
  vendor_name: string | null
  document_date: string | null
  document_number: string | null
  total_amount: number | null
  subtotal: number | null
  vat_amount: number
  currency: string
  invoice_rows: InvoiceLineRow[]
}

interface ExtractedDataPanelProps {
  sourceType: 'bank' | 'credit_card' | 'invoice'
  rows: TransactionRow[] | InvoiceWithRows[] | null
  loading: boolean
  onUpdate: (rowId: string, updates: any) => Promise<boolean>
  onDelete: (rowId: string) => Promise<boolean>
  onRefresh: () => void
}

/**
 * Panel showing extracted data with compact table layout
 */
export default function ExtractedDataPanel({
  sourceType,
  rows,
  loading,
  onUpdate,
  onDelete,
  onRefresh
}: ExtractedDataPanelProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    rowId: string | null
  }>({ isOpen: false, rowId: null })

  // Handle edit click
  const handleEdit = (row: any) => {
    setEditingRowId(row.id)
    setEditFormData(row)
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRowId(null)
    setEditFormData({})
  }

  // Handle save
  const handleSave = async (rowId: string) => {
    setSavingRowId(rowId)
    const success = await onUpdate(rowId, editFormData)
    setSavingRowId(null)

    if (success) {
      setEditingRowId(null)
      setEditFormData({})
      onRefresh()
    }
  }

  // Handle delete confirmation
  const handleDeleteClick = (rowId: string) => {
    setConfirmDelete({ isOpen: true, rowId })
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!confirmDelete.rowId) return

    setDeletingRowId(confirmDelete.rowId)
    const success = await onDelete(confirmDelete.rowId)
    setDeletingRowId(null)

    if (success) {
      onRefresh()
    }

    setConfirmDelete({ isOpen: false, rowId: null })
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading data...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!rows || rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <p className="text-gray-400">No data extracted yet</p>
        </div>
      </div>
    )
  }

  // Bank/Credit Card Transactions
  if (sourceType === 'bank' || sourceType === 'credit_card') {
    const transactions = rows as TransactionRow[]

    return (
      <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            Extracted Data ({transactions.length} {transactions.length === 1 ? 'row' : 'rows'})
          </h3>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Description</th>
                {sourceType === 'credit_card' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Business</th>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Currency</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Reference</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((tx) => {
                const isEditing = editingRowId === tx.id
                const isSaving = savingRowId === tx.id
                const isDeleting = deletingRowId === tx.id

                return (
                  <tr
                    key={tx.id}
                    className={`h-8 hover:bg-gray-800/50 transition-colors ${
                      isEditing ? 'border-l-4 border-green-500 bg-gray-800/30' : ''
                    } ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    {/* Date */}
                    <td className="px-3 py-1 text-xs text-gray-300 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.date || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        formatDate(tx.date)
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-3 py-1 text-xs text-gray-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.description || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        <span className="line-clamp-1">{tx.description}</span>
                      )}
                    </td>

                    {/* Business (credit card only) */}
                    {sourceType === 'credit_card' && (
                      <td className="px-3 py-1 text-xs text-gray-300 whitespace-nowrap">
                        {tx.source}
                      </td>
                    )}

                    {/* Amount */}
                    <td className="px-3 py-1 text-xs text-gray-300 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.amount || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        formatCurrency(tx.amount, tx.currency)
                      )}
                    </td>

                    {/* Currency */}
                    <td className="px-3 py-1 text-xs text-gray-400 whitespace-nowrap">
                      {tx.currency}
                    </td>

                    {/* Reference */}
                    <td className="px-3 py-1 text-xs text-gray-400 whitespace-nowrap">
                      {tx.reference || '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleSave(tx.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(tx)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx.id)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, rowId: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    )
  }

  // Invoice Rows
  if (sourceType === 'invoice') {
    const invoices = rows as InvoiceWithRows[]
    const invoice = invoices[0] // For now, assume one invoice per file
    const invoiceRows = invoice?.invoice_rows || []

    return (
      <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            Invoice Line Items ({invoiceRows.length} {invoiceRows.length === 1 ? 'row' : 'rows'})
          </h3>
          {invoice && (
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Vendor:</span>
                <span className="ml-2 text-white">{invoice.vendor_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Document #:</span>
                <span className="ml-2 text-white">{invoice.document_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Date:</span>
                <span className="ml-2 text-white">
                  {invoice.document_date ? formatDate(invoice.document_date) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Total:</span>
                <span className="ml-2 text-white">
                  {invoice.total_amount ? formatCurrency(invoice.total_amount, invoice.currency) : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Description</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Reference</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoiceRows.map((row) => {
                const isEditing = editingRowId === row.id
                const isSaving = savingRowId === row.id
                const isDeleting = deletingRowId === row.id

                return (
                  <tr
                    key={row.id}
                    className={`h-8 hover:bg-gray-800/50 transition-colors ${
                      isEditing ? 'border-l-4 border-green-500 bg-gray-800/30' : ''
                    } ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    {/* Date */}
                    <td className="px-3 py-1 text-xs text-gray-300 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.date || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        row.date ? formatDate(row.date) : '-'
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-3 py-1 text-xs text-gray-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.description || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        <span className="line-clamp-1">{row.description}</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-1 text-xs text-gray-300 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="1"
                          value={editFormData.quantity || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, quantity: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        row.quantity
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="px-3 py-1 text-xs text-gray-300 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.unit_price || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, unit_price: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        row.unit_price ? formatCurrency(row.unit_price, invoice?.currency || 'USD') : '-'
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-1 text-xs text-gray-300 text-right whitespace-nowrap">
                      {formatCurrency(row.amount, invoice?.currency || 'USD')}
                    </td>

                    {/* Reference */}
                    <td className="px-3 py-1 text-xs text-gray-400 whitespace-nowrap">
                      {row.reference || '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleSave(row.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(row)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(row.id)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, rowId: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Invoice Line Item"
          message="Are you sure you want to delete this line item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    )
  }

  return null
}
