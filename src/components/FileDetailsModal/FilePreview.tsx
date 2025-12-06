import { useState, useEffect } from 'react'
import { DocumentIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import type { Database } from '../../types/database'

type FileRow = Database['public']['Tables']['files']['Row']

interface FilePreviewProps {
  file: FileRow | null
  fileUrl: string | null
}

/**
 * File preview component - handles PDF, images, and CSV/Excel files
 */
export default function FilePreview({ file, fileUrl }: FilePreviewProps) {
  const [spreadsheetData, setSpreadsheetData] = useState<string[][] | null>(null)
  const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false)

  // Parse CSV/Excel files
  useEffect(() => {
    if (!file || !fileUrl) {
      setSpreadsheetData(null)
      return
    }

    if (file.file_type !== 'csv' && file.file_type !== 'excel') {
      setSpreadsheetData(null)
      return
    }

    const parseSpreadsheet = async () => {
      try {
        setLoadingSpreadsheet(true)

        // Fetch file
        const response = await fetch(fileUrl)
        const arrayBuffer = await response.arrayBuffer()

        // Parse with xlsx
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

        // Convert to 2D array
        const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })

        setSpreadsheetData(data)
        setLoadingSpreadsheet(false)
      } catch (error) {
        console.error('Failed to parse spreadsheet:', error)
        setSpreadsheetData(null)
        setLoadingSpreadsheet(false)
      }
    }

    parseSpreadsheet()
  }, [file, fileUrl])
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <DocumentIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No file selected</p>
        </div>
      </div>
    )
  }

  if (!fileUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading preview...</p>
        </div>
      </div>
    )
  }

  // PDF Preview
  if (file.file_type === 'pdf') {
    return (
      <div className="h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <iframe
          src={fileUrl}
          className="w-full h-full"
          title="PDF Preview"
        />
      </div>
    )
  }

  // Image Preview
  if (file.file_type === 'image') {
    return (
      <div className="h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center p-4">
        <img
          src={fileUrl}
          alt="File Preview"
          className="max-w-full max-h-full object-contain rounded"
        />
      </div>
    )
  }

  // CSV/Excel - Show spreadsheet table
  if (file.file_type === 'csv' || file.file_type === 'excel') {
    if (loadingSpreadsheet) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading spreadsheet...</p>
          </div>
        </div>
      )
    }

    if (!spreadsheetData || spreadsheetData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-center">
            <DocumentIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">No data found in spreadsheet</p>
          </div>
        </div>
      )
    }

    // Get max columns
    const maxCols = Math.max(...spreadsheetData.map(row => row.length))
    const columnHeaders = Array.from({ length: maxCols }, (_, i) =>
      String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '')
    )

    return (
      <div className="h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        {/* Spreadsheet Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-white">
              {file.filename}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {spreadsheetData.length} rows × {maxCols} columns
          </span>
        </div>

        {/* Spreadsheet Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-800">
                <th className="w-12 px-3 py-2 text-xs font-medium text-gray-400 border-r border-b border-gray-700 bg-gray-850">
                  #
                </th>
                {columnHeaders.map((header, i) => (
                  <th
                    key={i}
                    className="min-w-[120px] px-3 py-2 text-xs font-medium text-gray-400 border-r border-b border-gray-700 bg-gray-850 text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spreadsheetData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-800/50 transition-colors">
                  {/* Row number */}
                  <td className="px-3 py-2 text-xs text-gray-500 border-r border-b border-gray-800 bg-gray-900/50 text-center font-mono">
                    {rowIndex + 1}
                  </td>
                  {/* Cells */}
                  {columnHeaders.map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-3 py-2 text-xs text-gray-300 border-r border-b border-gray-800 whitespace-nowrap"
                    >
                      {row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
      <div className="text-center">
        <DocumentIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-400">Preview not available</p>
      </div>
    </div>
  )
}
