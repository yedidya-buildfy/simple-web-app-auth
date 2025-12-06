import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceRow = Database['public']['Tables']['invoice_rows']['Row']

interface InvoiceReviewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  onSave: (id: string, updates: Partial<Invoice>, lineItems: Partial<InvoiceRow>[]) => Promise<void>
}

export default function InvoiceReviewModal({
  isOpen,
  onClose,
  invoice,
  onSave,
}: InvoiceReviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<InvoiceRow[]>([])
  const [showPreview, setShowPreview] = useState(true)

  const [formData, setFormData] = useState({
    vendor_name: invoice.vendor_name || '',
    document_date: invoice.document_date || '',
    document_type: invoice.document_type || 'invoice',
    document_number: invoice.document_number || '',
    subtotal: invoice.subtotal?.toString() || '0',
    vat_rate: invoice.vat_rate?.toString() || '0',
    vat_amount: invoice.vat_amount?.toString() || '0',
    has_vat: invoice.has_vat,
    total_amount: invoice.total_amount?.toString() || '0',
    currency: invoice.currency || 'ILS',
    notes: invoice.notes || '',
  })

  useEffect(() => {
    if (!invoice.id) return

    const fetchLineItems = async () => {
      const { data, error: fetchError } = await supabase
        .from('invoice_rows')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at')

      if (fetchError) {
        console.error('Error fetching line items:', fetchError)
        return
      }

      if (data) {
        setLineItems(data)
      }
    }

    fetchLineItems()
  }, [invoice.id])

  useEffect(() => {
    // Reset form data when invoice changes
    setFormData({
      vendor_name: invoice.vendor_name || '',
      document_date: invoice.document_date || '',
      document_type: invoice.document_type || 'invoice',
      document_number: invoice.document_number || '',
      subtotal: invoice.subtotal?.toString() || '0',
      vat_rate: invoice.vat_rate?.toString() || '0',
      vat_amount: invoice.vat_amount?.toString() || '0',
      has_vat: invoice.has_vat,
      total_amount: invoice.total_amount?.toString() || '0',
      currency: invoice.currency || 'ILS',
      notes: invoice.notes || '',
    })
    setError(null)
  }, [invoice])

  const handleLineItemChange = (index: number, field: keyof InvoiceRow, value: any) => {
    const updatedItems = [...lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setLineItems(updatedItems)
  }

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `temp-${Date.now()}`,
        invoice_id: invoice.id,
        date: formData.document_date,
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        reference: null,
        transaction_id: null,
        matched: false,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const handleRemoveLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index)
    setLineItems(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updates: Partial<Invoice> = {
        vendor_name: formData.vendor_name || null,
        document_date: formData.document_date || null,
        document_type: formData.document_type as any,
        document_number: formData.document_number || null,
        subtotal: parseFloat(formData.subtotal) || null,
        vat_rate: parseFloat(formData.vat_rate) || 0,
        vat_amount: parseFloat(formData.vat_amount) || 0,
        has_vat: formData.has_vat,
        total_amount: parseFloat(formData.total_amount) || null,
        currency: formData.currency as any,
        notes: formData.notes || null,
        extraction_confidence: 1.0, // Manual verification = 100% confidence
        status: 'unmatched', // Change from 'manual' to 'unmatched' after review
      }

      const updatedLineItems = lineItems.map((item) => ({
        id: item.id,
        description: item.description || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || null,
        amount: item.amount || 0,
        date: item.date || null,
        reference: item.reference || null,
      }))

      await onSave(invoice.id, updates, updatedLineItems)
      onClose()
    } catch (err) {
      console.error('Error saving invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to save invoice')
    } finally {
      setLoading(false)
    }
  }


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="h-6 w-6 text-green-500" />
                    <Dialog.Title className="text-lg font-semibold text-white">
                      Review Invoice Extraction
                    </Dialog.Title>
                    {invoice.extraction_confidence !== null && invoice.extraction_confidence < 0.7 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-500">
                          Low Confidence: {Math.round((invoice.extraction_confidence || 0) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex">
                  {/* PDF Preview */}
                  {showPreview && invoice.storage_path && (
                    <div className="w-1/3 border-r border-gray-800 bg-black/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-300">Document Preview</h3>
                        <button
                          onClick={() => setShowPreview(false)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Hide
                        </button>
                      </div>
                      <div className="aspect-[8.5/11] bg-black rounded-lg border border-gray-700 overflow-hidden">
                        {invoice.storage_path && (
                          <iframe
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/files/${invoice.storage_path}`}
                            className="w-full h-full"
                            title="Invoice Preview"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <div className={showPreview ? 'w-2/3' : 'w-full'}>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                          <p className="text-sm text-red-400">{error}</p>
                        </div>
                      )}

                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wide">
                          Basic Information
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Vendor Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Vendor Name
                            </label>
                            <input
                              type="text"
                              value={formData.vendor_name}
                              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                              required
                            />
                          </div>

                          {/* Document Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Document Number
                            </label>
                            <input
                              type="text"
                              value={formData.document_number}
                              onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {/* Document Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={formData.document_date}
                              onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            />
                          </div>

                          {/* Document Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Type
                            </label>
                            <select
                              value={formData.document_type}
                              onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            >
                              <option value="invoice">Invoice</option>
                              <option value="receipt">Receipt</option>
                              <option value="credit_note">Credit Note</option>
                              <option value="quote">Quote</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          {/* Currency */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Currency
                            </label>
                            <select
                              value={formData.currency}
                              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            >
                              <option value="ILS">ILS (₪)</option>
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wide">
                          Amounts
                        </h3>

                        <div className="grid grid-cols-4 gap-4">
                          {/* Subtotal */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Subtotal
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.subtotal}
                              onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                            />
                          </div>

                          {/* VAT Rate */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              VAT Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.vat_rate}
                              onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                              disabled={!formData.has_vat}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
                            />
                          </div>

                          {/* VAT Amount */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              VAT Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.vat_amount}
                              onChange={(e) => setFormData({ ...formData, vat_amount: e.target.value })}
                              disabled={!formData.has_vat}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
                            />
                          </div>

                          {/* Total */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Total Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.total_amount}
                              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={formData.has_vat}
                              onChange={(e) => setFormData({ ...formData, has_vat: e.target.checked })}
                              className="rounded bg-black/50 border-gray-700 text-green-500 focus:ring-green-500/50"
                            />
                            Invoice includes VAT
                          </label>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wide">
                            Line Items ({lineItems.length})
                          </h3>
                          <button
                            type="button"
                            onClick={handleAddLineItem}
                            className="text-xs px-3 py-1 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            + Add Item
                          </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {lineItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-black/30 rounded-lg border border-gray-800">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                  placeholder="Description"
                                  className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-green-500/50"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))}
                                  placeholder="Qty"
                                  className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-green-500/50"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                  placeholder="Price"
                                  className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-green-500/50"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={(e) => handleLineItemChange(index, 'amount', parseFloat(e.target.value))}
                                  placeholder="Amount"
                                  className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-green-500/50"
                                />
                              </div>
                              <div className="col-span-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(index)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none"
                          placeholder="Add notes..."
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <p className="text-xs text-gray-400">
                          After saving, this invoice will be marked as manually verified (100% confidence)
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-black bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Saving...' : 'Save & Approve'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
