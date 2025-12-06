import { Fragment, useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import FilePreview from './FilePreview'
import ExtractedDataPanel from './ExtractedDataPanel'
import {
  useFileDetails,
  useUpdateTransaction,
  useDeleteTransaction,
  useUpdateInvoiceRow,
  useDeleteInvoiceRow
} from '../../hooks/useFileDetails'

interface FileDetailsModalProps {
  fileId: string | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Large modal showing file preview and extracted data
 * 95vh x 95vw, split view with resizable divider
 */
export default function FileDetailsModal({
  fileId,
  isOpen,
  onClose
}: FileDetailsModalProps) {
  const { file, fileUrl, rows, loading, refresh } = useFileDetails(fileId)
  const { updateTransaction } = useUpdateTransaction()
  const { deleteTransaction } = useDeleteTransaction()
  const { updateInvoiceRow } = useUpdateInvoiceRow()
  const { deleteInvoiceRow } = useDeleteInvoiceRow()

  // Resizable split state
  const [leftPanelWidth, setLeftPanelWidth] = useState(40) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle divider drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // Handle divider drag
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newWidth, 20), 80)
    setLeftPanelWidth(constrainedWidth)
  }, [isDragging])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleDrag, handleDragEnd])

  // Handle update based on source type
  const handleUpdate = async (rowId: string, updates: any): Promise<boolean> => {
    if (!file) return false

    if (file.source_type === 'bank' || file.source_type === 'credit_card') {
      return await updateTransaction(rowId, updates)
    } else if (file.source_type === 'invoice') {
      return await updateInvoiceRow(rowId, updates)
    }

    return false
  }

  // Handle delete based on source type
  const handleDelete = async (rowId: string): Promise<boolean> => {
    if (!file) return false

    if (file.source_type === 'bank' || file.source_type === 'credit_card') {
      return await deleteTransaction(rowId)
    } else if (file.source_type === 'invoice') {
      return await deleteInvoiceRow(rowId)
    }

    return false
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-[95vw] h-[95vh] max-w-[1800px] transform overflow-hidden rounded-2xl bg-gray-950 border border-gray-800 shadow-xl transition-all flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <Dialog.Title as="h2" className="text-xl font-semibold text-white">
                    {file?.filename || 'File Details'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content - Split View */}
                <div ref={containerRef} className="flex-1 flex p-6 overflow-hidden">
                  {/* Left Panel: File Preview (Resizable) */}
                  <div
                    style={{ width: `${leftPanelWidth}%` }}
                    className="min-w-[300px] overflow-hidden"
                  >
                    <FilePreview file={file} fileUrl={fileUrl} />
                  </div>

                  {/* Draggable Divider */}
                  <div
                    onMouseDown={handleDragStart}
                    className={`
                      w-1 mx-3 cursor-col-resize flex-shrink-0 relative group
                      ${isDragging ? 'bg-green-500' : 'bg-gray-800 hover:bg-green-500/50'}
                      transition-colors
                    `}
                  >
                    {/* Wider hover target */}
                    <div className="absolute inset-y-0 -left-2 -right-2" />

                    {/* Visual indicator dots */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                    </div>
                  </div>

                  {/* Right Panel: Extracted Data (Resizable) */}
                  <div
                    style={{ width: `${100 - leftPanelWidth}%` }}
                    className="min-w-0 overflow-hidden"
                  >
                    {file?.status === 'pending' ? (
                      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
                        <div className="text-center">
                          <p className="text-gray-400">File has not been processed yet</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Click "Process" to extract data from this file
                          </p>
                        </div>
                      </div>
                    ) : file?.status === 'error' ? (
                      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
                        <div className="text-center">
                          <p className="text-red-400">Error processing file</p>
                          {file.error_message && (
                            <p className="text-xs text-gray-500 mt-2">{file.error_message}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <ExtractedDataPanel
                        sourceType={file?.source_type || 'bank'}
                        rows={rows}
                        loading={loading}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onRefresh={refresh}
                      />
                    )}
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
