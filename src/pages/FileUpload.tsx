import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  TrashIcon,
  DocumentIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  HomeIcon,
  BanknotesIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import FileUploader from '../components/FileUploader'
import ConfirmationModal from '../components/ConfirmationModal'
import FileDetailsModal from '../components/FileDetailsModal/FileDetailsModal'
import { useFileUpload } from '../hooks/useFileUpload'
import { useFileProcessor } from '../hooks/useFileProcessor'
import { formatFileSize } from '../lib/storage'
import type { Database } from '../types/database'
import type { NavItemType } from '@/components/application/app-navigation/config'
import { SidebarNavigationSlim } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

type FileSourceType = Database['public']['Tables']['files']['Row']['source_type']
type FileStatus = Database['public']['Tables']['files']['Row']['status']

const navItems: NavItemType[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { label: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon },
  { label: 'Matching', href: '/matching', icon: SparklesIcon },
  { label: 'Reports', href: '/reports', icon: ChartPieIcon },
]

/**
 * FileUpload Page
 * Handles file upload for bank statements, credit cards, and invoices
 */
export default function FileUpload() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const {
    uploadFile,
    deleteUploadedFile,
    uploadProgress,
    uploading,
    error,
    files,
    loading,
    fetchFiles
  } = useFileUpload()

  const [selectedSourceType, setSelectedSourceType] = useState<FileSourceType>('bank')
  const [filterStatus, setFilterStatus] = useState<FileStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<'filename' | 'created_at' | 'file_size'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // File details modal state
  const [fileDetailsModal, setFileDetailsModal] = useState<{
    isOpen: boolean
    fileId: string | null
  }>({
    isOpen: false,
    fileId: null
  })

  // File processor hook
  const { processFile, processBatch, processing, progress, error: processingError } = useFileProcessor()

  // Fetch files on mount
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  /**
   * Handle file selection
   */
  const handleFilesSelected = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      try {
        await uploadFile(file, selectedSourceType)
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
  }

  /**
   * Handle file deletion
   */
  const handleDeleteFile = (fileId: string, storagePath: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete File',
      message: 'Are you sure you want to delete this file? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setDeletingFileId(fileId)
          await deleteUploadedFile(fileId, storagePath)
        } catch (err) {
          console.error('Delete failed:', err)
        } finally {
          setDeletingFileId(null)
        }
      }
    })
  }

  /**
   * Handle file processing
   */
  const handleProcessFile = async (fileId: string) => {
    try {
      // Process directly (invoice review modal will be added later)
      await processFile(fileId)
    } catch (err) {
      console.error('Processing failed:', err)
    } finally {
      // Always refresh file list to show updated status
      await fetchFiles()
    }
  }

  /**
   * Handle batch processing
   */
  const handleBatchProcess = async () => {
    if (selectedFileIds.size === 0) {
      alert('Please select files to process')
      return
    }

    try {
      const fileIdsArray = Array.from(selectedFileIds)
      await processBatch(fileIdsArray)
    } catch (err) {
      console.error('Batch processing failed:', err)
    } finally {
      // Always clear selection and refresh, even on error
      setSelectedFileIds(new Set())
      await fetchFiles()
    }
  }

  /**
   * Toggle file selection
   */
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFileIds)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFileIds(newSelection)
  }

  /**
   * Toggle all files selection
   */
  const toggleAllFiles = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set())
    } else {
      const allFileIds = filteredFiles.map(f => f.id)
      setSelectedFileIds(new Set(allFileIds))
    }
  }

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (selectedFileIds.size === 0) {
      return
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Files',
      message: `Are you sure you want to delete ${selectedFileIds.size} selected file(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setDeletingFileId('bulk')
          const fileIdsArray = Array.from(selectedFileIds)
          const filesToDelete = files.filter(f => fileIdsArray.includes(f.id))

          // Delete all files in parallel from storage
          const storageDeletePromises = filesToDelete.map(file =>
            supabase.storage
              .from('files')
              .remove([file.storage_path])
          )

          await Promise.all(storageDeletePromises)

          // Delete all files from database in one batch
          const { error: dbError } = await supabase
            .from('files')
            .delete()
            .in('id', fileIdsArray)

          if (dbError) {
            throw dbError
          }

          // Clear selection
          setSelectedFileIds(new Set())
        } catch (err) {
          console.error('Bulk delete failed:', err)
        } finally {
          setDeletingFileId(null)
          // Refresh list once at the end
          await fetchFiles()
        }
      }
    })
  }

  /**
   * Handle sort
   */
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  /**
   * Filter and sort files
   */
  const filteredFiles = files
    .filter(file => {
      // Filter by status
      if (filterStatus !== 'all' && file.status !== filterStatus) return false

      // Filter by search query
      if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename)
          break
        case 'file_size':
          comparison = (a.file_size || 0) - (b.file_size || 0)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status: FileStatus) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/10 text-green-400 border-green-500/30',
      error: 'bg-red-500/10 text-red-400 border-red-500/30'
    }

    const icons = {
      pending: '⏱',
      processing: '↻',
      completed: '✓',
      error: '✕'
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${styles[status]}`}>
        <span>{icons[status]}</span>
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    )
  }

  /**
   * Get file type icon color
   */
  const getFileTypeColor = (fileType: string) => {
    const colors = {
      excel: 'text-green-500',
      csv: 'text-blue-500',
      pdf: 'text-red-500',
      image: 'text-purple-500'
    }
    return colors[fileType as keyof typeof colors] || 'text-gray-500'
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  /**
   * Handle file row click to open details modal
   */
  const handleFileClick = (fileId: string) => {
    setFileDetailsModal({
      isOpen: true,
      fileId
    })
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNavigationSlim
        items={navItems}
        footerItems={[
          { label: 'Support', href: '/support', icon: LifebuoyIcon },
          { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white">File Upload</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black transition-all"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Processing Progress Banner */}
        {processing && progress && (
          <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium text-green-400">Processing file...</p>
                  <p className="text-xs text-gray-400 mt-0.5">{progress}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Error Banner */}
        {processingError && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">Processing Error</p>
                <p className="text-xs text-gray-400 mt-0.5">{processingError.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          {/* Source Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Source Type
            </label>
            <div className="flex space-x-4">
              {(['bank', 'credit_card', 'invoice'] as FileSourceType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedSourceType(type)}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${selectedSourceType === type
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
                    }
                  `}
                >
                  {type === 'credit_card' ? 'Credit Card' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* File Uploader */}
          <FileUploader
            onFilesSelected={handleFilesSelected}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
          />
        </div>

        {/* Files Table Section */}
        <div className="bg-gray-950 rounded-lg border border-gray-900">
          {/* Table Header with Filters */}
          <div className="p-6 border-b border-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
              <div className="flex items-center space-x-3">
                {/* Bulk Action Buttons */}
                {selectedFileIds.size > 0 && (
                  <>
                    <button
                      onClick={handleBatchProcess}
                      disabled={processing || deletingFileId !== null}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayIcon className="w-4 h-4 mr-1.5" />
                      Process ({selectedFileIds.size})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={processing || deletingFileId !== null}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="w-4 h-4 mr-1.5" />
                      Delete ({selectedFileIds.size})
                    </button>
                  </>
                )}
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <FunnelIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FileStatus | 'all')}
                    className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-400">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">No files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.size > 0 && selectedFileIds.size === filteredFiles.length}
                        onChange={toggleAllFiles}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500 focus:ring-offset-gray-950"
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('filename')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {sortColumn === 'filename' && (
                          <span className="text-green-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                      Type
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('file_size')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Size</span>
                        {sortColumn === 'file_size' && (
                          <span className="text-green-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {sortColumn === 'created_at' && (
                          <span className="text-green-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">

                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className={`hover:bg-gray-900/30 transition-colors cursor-pointer ${selectedFileIds.has(file.id) ? 'bg-gray-900/50' : ''}`}
                      onClick={() => handleFileClick(file.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedFileIds.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500 focus:ring-offset-gray-950"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <DocumentIcon className={`w-4 h-4 flex-shrink-0 ${getFileTypeColor(file.file_type)}`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-white truncate">
                              {file.filename}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {file.source_type === 'credit_card' ? 'Credit Card' : file.source_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(file.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-400 capitalize">
                          {file.file_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        {file.file_size ? formatFileSize(file.file_size) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          {/* Process Button - Show for pending files */}
                          {file.status === 'pending' && (
                            <button
                              onClick={() => handleProcessFile(file.id)}
                              disabled={processing}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Process file"
                            >
                              <PlayIcon className="w-3.5 h-3.5 mr-1" />
                              Process
                            </button>
                          )}

                          {/* Show items count for completed files */}
                          {file.status === 'completed' && file.items_count > 0 && (
                            <span className="text-xs text-green-500 mr-1">
                              {file.items_count} items
                            </span>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteFile(file.id, file.storage_path)}
                            disabled={deletingFileId === file.id || deletingFileId === 'bulk' || processing}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                            title="Delete file"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && filteredFiles.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-900">
              <p className="text-sm text-gray-400">
                Showing {filteredFiles.length} of {files.length} files
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>

      {/* Invoice Review Modal - TODO: Create dedicated extraction review component */}
      {/* For now, invoice review happens inline during processing */}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* File Details Modal */}
      <FileDetailsModal
        fileId={fileDetailsModal.fileId}
        isOpen={fileDetailsModal.isOpen}
        onClose={() => {
          setFileDetailsModal({ isOpen: false, fileId: null })
          // Refresh files list in case data was edited
          fetchFiles()
        }}
      />
</div>
  )
}
