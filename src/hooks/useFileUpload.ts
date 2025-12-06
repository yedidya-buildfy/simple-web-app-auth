import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { uploadFile, detectFileType, deleteFile } from '../lib/storage'
import type { Database } from '../types/database'

type FileSourceType = Database['public']['Tables']['files']['Row']['source_type']
type FileStatus = Database['public']['Tables']['files']['Row']['status']

export interface UploadedFile {
  id: string
  filename: string
  file_type: 'excel' | 'csv' | 'pdf' | 'image'
  source_type: FileSourceType
  storage_path: string
  file_size: number | null
  status: FileStatus
  error_message: string | null
  items_count: number
  created_at: string
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, sourceType: FileSourceType) => Promise<void>
  deleteUploadedFile: (fileId: string, storagePath: string) => Promise<void>
  uploadProgress: Record<string, number>
  uploading: boolean
  error: Error | null
  files: UploadedFile[]
  loading: boolean
  fetchFiles: () => Promise<void>
}

/**
 * Custom hook for file upload operations
 * Handles upload to Supabase Storage and database record creation
 */
export function useFileUpload(): UseFileUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * Fetch all uploaded files for the current user
   */
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setFiles(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Upload file to storage and create database record
   */
  const uploadFileHandler = useCallback(async (file: File, sourceType: FileSourceType) => {
    try {
      setUploading(true)
      setError(null)
      setUploadProgress({ [file.name]: 0 })

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Update progress to 30%
      setUploadProgress({ [file.name]: 30 })

      // Upload to Supabase Storage
      const { path, error: uploadError } = await uploadFile(file, user.id, sourceType)

      if (uploadError || !path) {
        throw uploadError || new Error('Failed to upload file')
      }

      // Update progress to 60%
      setUploadProgress({ [file.name]: 60 })

      // Detect file type
      const fileType = detectFileType(file.name)

      // Create database record
      // Using 'any' type assertion due to Supabase client type inference issue
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: fileType,
          source_type: sourceType,
          storage_path: path,
          file_size: file.size,
          status: 'pending',
          items_count: 0
        } as any)

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await deleteFile(path)
        throw dbError
      }

      // Update progress to 100%
      setUploadProgress({ [file.name]: 100 })

      // Refresh file list
      await fetchFiles()

      // Clear progress after 1 second
      const timeoutId = setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }, 1000)

      // Cleanup will be handled by component unmount if needed
      return () => clearTimeout(timeoutId)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setUploading(false)
    }
  }, [fetchFiles])

  /**
   * Delete uploaded file from storage and database
   */
  const deleteUploadedFile = useCallback(async (fileId: string, storagePath: string) => {
    try {
      setError(null)

      // Delete from storage
      const { error: storageError } = await deleteFile(storagePath)

      if (storageError) {
        throw storageError
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        throw dbError
      }

      // Refresh file list
      await fetchFiles()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [fetchFiles])

  return {
    uploadFile: uploadFileHandler,
    deleteUploadedFile,
    uploadProgress,
    uploading,
    error,
    files,
    loading,
    fetchFiles
  }
}
