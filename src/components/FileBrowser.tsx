import { useState, useEffect } from 'react'
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../types/database'

type File = Database['public']['Tables']['files']['Row']

interface FileNode extends File {
  year?: number
  month?: string
  monthNumber?: number
}

interface MonthNode {
  month: string
  monthNumber: number
  files: FileNode[]
  isExpanded: boolean
}

interface YearNode {
  year: number
  months: MonthNode[]
  isExpanded: boolean
}

export default function FileBrowser() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<FileNode[]>([])
  const [yearNodes, setYearNodes] = useState<YearNode[]>([])

  useEffect(() => {
    if (!user) return

    const fetchFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (!data || data.length === 0) {
          setFiles([])
          return
        }

        // Process files and add year/month info
        const processedFiles: FileNode[] = (data as File[]).map(file => {
          const date = new Date(file.created_at)
          return {
            ...file,
            year: date.getFullYear(),
            monthNumber: date.getMonth(),
            month: date.toLocaleDateString('en-US', { month: 'long' }),
          }
        })

        setFiles(processedFiles)

        // Organize files into year/month structure
        const yearMap = new Map<number, Map<number, FileNode[]>>()

        processedFiles.forEach(file => {
          if (!file.year || file.monthNumber === undefined) return

          if (!yearMap.has(file.year)) {
            yearMap.set(file.year, new Map())
          }

          const monthMap = yearMap.get(file.year)!
          if (!monthMap.has(file.monthNumber)) {
            monthMap.set(file.monthNumber, [])
          }

          monthMap.get(file.monthNumber)!.push(file)
        })

        // Convert to array structure
        const years: YearNode[] = Array.from(yearMap.entries())
          .map(([year, monthMap]) => ({
            year,
            isExpanded: false,
            months: Array.from(monthMap.entries())
              .map(([monthNumber, monthFiles]) => ({
                month: monthFiles[0].month!,
                monthNumber,
                files: monthFiles,
                isExpanded: false,
              }))
              .sort((a, b) => b.monthNumber - a.monthNumber),
          }))
          .sort((a, b) => b.year - a.year)

        setYearNodes(years)
      } catch (err) {
        console.error('Error fetching files:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [user])

  const toggleYear = (year: number) => {
    setYearNodes(prev =>
      prev.map(node =>
        node.year === year ? { ...node, isExpanded: !node.isExpanded } : node
      )
    )
  }

  const toggleMonth = (year: number, monthNumber: number) => {
    setYearNodes(prev =>
      prev.map(yearNode =>
        yearNode.year === year
          ? {
              ...yearNode,
              months: yearNode.months.map(monthNode =>
                monthNode.monthNumber === monthNumber
                  ? { ...monthNode, isExpanded: !monthNode.isExpanded }
                  : monthNode
              ),
            }
          : yearNode
      )
    )
  }

  const handleDownload = async (file: FileNode) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'excel':
      case 'csv':
        return <DocumentTextIcon className="h-4 w-4 text-green-500" />
      case 'pdf':
        return <DocumentTextIcon className="h-4 w-4 text-red-500" />
      case 'image':
        return <DocumentTextIcon className="h-4 w-4 text-blue-500" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getFileCount = (year: number) => {
    const yearNode = yearNodes.find(n => n.year === year)
    if (!yearNode) return 0
    return yearNode.months.reduce((sum, month) => sum + month.files.length, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-green-500" />
          <h3 className="text-sm font-semibold text-white">Files</h3>
          <span className="text-xs text-gray-500">({files.length} total)</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
          <CloudArrowUpIcon className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Tree View */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {yearNodes.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {yearNodes.map(yearNode => (
              <div key={yearNode.year}>
                {/* Year Folder */}
                <button
                  onClick={() => toggleYear(yearNode.year)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-black/50 rounded-lg transition-colors"
                >
                  {yearNode.isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                  <FolderIcon className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{yearNode.year}</span>
                  <span className="text-xs text-gray-500">
                    ({getFileCount(yearNode.year)} files)
                  </span>
                </button>

                {/* Month Folders */}
                {yearNode.isExpanded && (
                  <div className="ml-4 space-y-1">
                    {yearNode.months.map(monthNode => (
                      <div key={monthNode.monthNumber}>
                        {/* Month Folder */}
                        <button
                          onClick={() => toggleMonth(yearNode.year, monthNode.monthNumber)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-black/50 rounded-lg transition-colors"
                        >
                          {monthNode.isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          )}
                          <FolderIcon className="h-5 w-5 text-green-500" />
                          <span>{monthNode.month}</span>
                          <span className="text-xs text-gray-500">
                            ({monthNode.files.length} files)
                          </span>
                        </button>

                        {/* Files */}
                        {monthNode.isExpanded && (
                          <div className="ml-4 space-y-1">
                            {monthNode.files.map(file => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-black/50 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getFileIcon(file.file_type)}
                                  <span className="text-gray-300 truncate">
                                    {file.filename}
                                  </span>
                                  {file.items_count > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({file.items_count} items)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      file.status === 'completed'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : file.status === 'processing'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : file.status === 'error'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}
                                  >
                                    {file.status}
                                  </span>
                                  <button
                                    onClick={() => handleDownload(file)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-green-500 transition-all"
                                    title="Download"
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
