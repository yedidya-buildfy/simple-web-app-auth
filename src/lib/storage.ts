import { supabase } from './supabase'

/**
 * Storage Helper for Supabase Storage Operations
 * Handles file uploads, deletions, and URL generation for the 'files' bucket
 */

export interface UploadFileResult {
  path: string | null
  error: Error | null
}

export interface DeleteFileResult {
  error: Error | null
}

export interface GetFileUrlResult {
  url: string | null
  error: Error | null
}

/**
 * Detect file type based on extension
 */
export function detectFileType(filename: string): 'excel' | 'csv' | 'pdf' | 'image' {
  const extension = filename.toLowerCase().split('.').pop()

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return 'excel'
    case 'csv':
      return 'csv'
    case 'pdf':
      return 'pdf'
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'image'
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

/**
 * Validate file type
 */
export function validateFileType(filename: string): boolean {
  const allowedExtensions = ['xlsx', 'xls', 'csv', 'pdf', 'jpg', 'jpeg', 'png']
  const extension = filename.toLowerCase().split('.').pop()
  return allowedExtensions.includes(extension || '')
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(file: File): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  return file.size <= maxSize
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID
 * @param sourceType - The source type (bank, credit_card, invoice)
 * @returns Object with path or error
 */
export async function uploadFile(
  file: File,
  userId: string,
  sourceType: 'bank' | 'credit_card' | 'invoice'
): Promise<UploadFileResult> {
  try {
    // Validate file type
    if (!validateFileType(file.name)) {
      throw new Error('Invalid file type. Allowed: .xlsx, .xls, .csv, .pdf, .jpg, .png')
    }

    // Validate file size
    if (!validateFileSize(file)) {
      throw new Error('File size exceeds 10MB limit')
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${userId}/${sourceType}/${timestamp}_${sanitizedFilename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    return { path: data.path, error: null }
  } catch (error) {
    return { path: null, error: error as Error }
  }
}

/**
 * Delete a file from Supabase Storage
 * @param path - The storage path of the file
 * @returns Object with error or null
 */
export async function deleteFile(path: string): Promise<DeleteFileResult> {
  try {
    const { error } = await supabase.storage
      .from('files')
      .remove([path])

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Get a signed URL for a file (works with private buckets)
 * @param path - The storage path of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with URL or error
 */
export async function getFileUrl(path: string, expiresIn: number = 3600): Promise<GetFileUrlResult> {
  try {
    // Use createSignedUrl for private buckets (creates temporary authenticated URL)
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    if (!data?.signedUrl) {
      throw new Error('Failed to generate signed URL')
    }

    return { url: data.signedUrl, error: null }
  } catch (error) {
    return { url: null, error: error as Error }
  }
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
