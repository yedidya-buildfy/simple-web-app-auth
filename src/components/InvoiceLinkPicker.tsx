import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon, DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../types/database'

type Invoice = Database['public']['Tables']['invoices']['Row']
type File = Database['public']['Tables']['files']['Row']

interface InvoiceLinkPickerProps {
  isOpen: boolean
  onClose: () => void
  onLink: (invoiceId: string) => Promise<void>
}

export default function InvoiceLinkPicker({
  isOpen,
  onClose,
  onLink,
}: InvoiceLinkPickerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<(Invoice & { file?: File })[]>([])
  const [search, setSearch] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !isOpen) return

    const fetchInvoices = async () => {
      setLoading(true)
      try {
        // Fetch invoices with their files
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('document_date', { ascending: false })

        if (invoicesError) throw invoicesError

        if (!invoicesData) {
          setInvoices([])
          return
        }

        // Fetch related files for invoices that have file_id
        const fileIds = (invoicesData as Invoice[])
          .filter(inv => inv.file_id)
          .map(inv => inv.file_id!)

        let filesMap: Record<string, File> = {}
        if (fileIds.length > 0) {
          const { data: filesData, error: filesError } = await supabase
            .from('files')
            .select('*')
            .in('id', fileIds)

          if (!filesError && filesData) {
            filesMap = (filesData as File[]).reduce((acc, file) => {
              acc[file.id] = file
              return acc
            }, {} as Record<string, File>)
          }
        }

        // Combine invoices with their files
        const invoicesWithFiles = (invoicesData as Invoice[]).map(invoice => ({
          ...invoice,
          file: invoice.file_id ? filesMap[invoice.file_id] : undefined,
        }))

        setInvoices(invoicesWithFiles)
      } catch (err) {
        console.error('Error fetching invoices:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [user, isOpen])

  const filteredInvoices = invoices.filter(invoice => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      invoice.vendor_name?.toLowerCase().includes(searchLower) ||
      invoice.document_number?.toLowerCase().includes(searchLower) ||
      invoice.file?.filename?.toLowerCase().includes(searchLower)
    )
  })

  const handleLink = async () => {
    if (!selectedInvoiceId) return

    try {
      setLoading(true)
      await onLink(selectedInvoiceId)
      onClose()
    } catch (err) {
      console.error('Error linking invoice:', err)
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Link Invoice
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-800">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by vendor, document number, or filename..."
                      className="w-full pl-10 pr-3 py-2 bg-black/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Invoice List */}
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        {search ? 'No invoices match your search' : 'No invoices available'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredInvoices.map(invoice => (
                        <button
                          key={invoice.id}
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedInvoiceId === invoice.id
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-black/50 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <DocumentTextIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <h4 className="text-sm font-medium text-white truncate">
                                  {invoice.vendor_name || 'Unknown Vendor'}
                                </h4>
                              </div>
                              <div className="space-y-1">
                                {invoice.document_number && (
                                  <p className="text-xs text-gray-400">
                                    Doc #: {invoice.document_number}
                                  </p>
                                )}
                                {invoice.document_date && (
                                  <p className="text-xs text-gray-400">
                                    Date: {new Date(invoice.document_date).toLocaleDateString()}
                                  </p>
                                )}
                                {invoice.file?.filename && (
                                  <p className="text-xs text-gray-500 truncate">
                                    File: {invoice.file.filename}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              {invoice.total_amount && (
                                <p className="text-sm font-semibold text-white">
                                  {invoice.currency} {invoice.total_amount.toFixed(2)}
                                </p>
                              )}
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                                  invoice.status === 'matched'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : invoice.status === 'partially_matched'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-black/50">
                  <p className="text-xs text-gray-500">
                    {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLink}
                      disabled={!selectedInvoiceId || loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Link Invoice
                    </button>
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
