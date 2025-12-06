import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { ArrowUpTrayIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  uploading?: boolean
  uploadProgress?: Record<string, number>
  error?: Error | null
}

/**
 * Reusable drag-and-drop file uploader component
 * Supports multiple file types with validation
 */
export default function FileUploader({
  onFilesSelected,
  accept = '.xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  uploading = false,
  uploadProgress = {},
  error = null
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `${file.name} exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
    }

    // Check file type
    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    const fileExtension = '.' + file.name.toLowerCase().split('.').pop()

    if (!allowedExtensions.includes(fileExtension)) {
      return `${file.name} is not an allowed file type`
    }

    return null
  }

  /**
   * Handle files selection
   */
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const errors: string[] = []
    const validFiles: File[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setValidationError(errors.join(', '))
      return
    }

    setValidationError(null)
    setSelectedFiles(validFiles)
    onFilesSelected(validFiles)
  }

  /**
   * Handle drag events
   */
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  /**
   * Handle drop event
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  /**
   * Handle file input change
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    inputRef.current?.click()
  }

  /**
   * Get upload progress for a file
   */
  const getProgress = (filename: string): number => {
    return uploadProgress[filename] || 0
  }

  /**
   * Check if file is uploading
   */
  const isFileUploading = (filename: string): boolean => {
    return uploadProgress[filename] !== undefined
  }

  /**
   * Check if file upload is complete
   */
  const isFileComplete = (filename: string): boolean => {
    return uploadProgress[filename] === 100
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${dragActive
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${dragActive ? 'bg-green-500/20' : 'bg-gray-800'}
          `}>
            <ArrowUpTrayIcon className={`
              w-8 h-8
              ${dragActive ? 'text-green-500' : 'text-gray-400'}
            `} />
          </div>

          <div>
            <p className="text-lg font-medium text-white">
              {dragActive ? 'Drop files here' : 'Drop files or click to upload'}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Supports: Excel, CSV, PDF, Images (max {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start space-x-3">
            <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{validationError}</p>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start space-x-3">
            <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error.message}</p>
          </div>
        </div>
      )}

      {/* Selected Files with Progress */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          {selectedFiles.map((file, index) => {
            const progress = getProgress(file.name)
            const isUploading = isFileUploading(file.name)
            const isComplete = isFileComplete(file.name)

            return (
              <div
                key={index}
                className="p-4 rounded-lg bg-gray-900 border border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <DocumentIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {isComplete && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
