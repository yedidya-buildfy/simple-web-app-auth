/**
 * Database Types for InvoiceMatch
 * Version: 1.0.0
 * Generated: 2025-12-05
 *
 * NOTE: In production, generate these types using:
 * supabase gen types typescript --local > src/types/database.ts
 *
 * For now, these are manually created based on the schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          display_name: string | null
          default_currency: string
          date_format: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          default_currency?: string
          date_format?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          default_currency?: string
          date_format?: string
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          name: string
          tax_id: string | null
          logo_url: string | null
          color: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          tax_id?: string | null
          logo_url?: string | null
          color?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          tax_id?: string | null
          logo_url?: string | null
          color?: string
          is_default?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer'
          icon: string | null
          color: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer'
          icon?: string | null
          color?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense' | 'transfer'
          icon?: string | null
          color?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      vendor_aliases: {
        Row: {
          id: string
          user_id: string | null
          primary_name: string
          aliases: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          primary_name: string
          aliases?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          primary_name?: string
          aliases?: string[]
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_type: 'excel' | 'csv' | 'pdf' | 'image'
          source_type: 'bank' | 'credit_card' | 'invoice'
          storage_path: string
          file_size: number | null
          status: 'pending' | 'processing' | 'completed' | 'error'
          error_message: string | null
          items_count: number
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_type: 'excel' | 'csv' | 'pdf' | 'image'
          source_type: 'bank' | 'credit_card' | 'invoice'
          storage_path: string
          file_size?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          error_message?: string | null
          items_count?: number
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_type?: 'excel' | 'csv' | 'pdf' | 'image'
          source_type?: 'bank' | 'credit_card' | 'invoice'
          storage_path?: string
          file_size?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          error_message?: string | null
          items_count?: number
          processed_at?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          business_id: string | null
          category_id: string | null
          date: string
          source: string
          description: string | null
          amount: number
          currency: string
          reference: string | null
          direction: 'income' | 'expense' | 'transfer' | 'credit_detail'
          invoice_id: string | null
          has_vat: 'yes' | 'no' | 'N/A'
          vat_amount: number
          match_quality: 'exact' | 'partial_amount' | 'partial_date' | 'ai_matched' | null
          match_color: string | null
          hash: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          business_id?: string | null
          category_id?: string | null
          date: string
          source: string
          description?: string | null
          amount: number
          currency?: string
          reference?: string | null
          direction: 'income' | 'expense' | 'transfer' | 'credit_detail'
          invoice_id?: string | null
          has_vat?: 'yes' | 'no' | 'N/A'
          vat_amount?: number
          match_quality?: 'exact' | 'partial_amount' | 'partial_date' | 'ai_matched' | null
          match_color?: string | null
          hash: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          business_id?: string | null
          category_id?: string | null
          date?: string
          source?: string
          description?: string | null
          amount?: number
          currency?: string
          reference?: string | null
          direction?: 'income' | 'expense' | 'transfer' | 'credit_detail'
          invoice_id?: string | null
          has_vat?: 'yes' | 'no' | 'N/A'
          vat_amount?: number
          match_quality?: 'exact' | 'partial_amount' | 'partial_date' | 'ai_matched' | null
          match_color?: string | null
          hash?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          business_id: string | null
          vendor_name: string | null
          document_date: string | null
          document_type: 'invoice' | 'receipt' | 'credit_note' | 'quote' | 'other' | null
          document_number: string | null
          total_amount: number | null
          subtotal: number | null
          vat_amount: number
          vat_rate: number
          has_vat: boolean
          currency: string
          storage_path: string | null
          thumbnail_path: string | null
          extraction_confidence: number | null
          raw_extraction: Json | null
          status: 'pending' | 'matched' | 'partially_matched' | 'unmatched' | 'manual'
          matched_transactions_count: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          business_id?: string | null
          vendor_name?: string | null
          document_date?: string | null
          document_type?: 'invoice' | 'receipt' | 'credit_note' | 'quote' | 'other' | null
          document_number?: string | null
          total_amount?: number | null
          subtotal?: number | null
          vat_amount?: number
          vat_rate?: number
          has_vat?: boolean
          currency?: string
          storage_path?: string | null
          thumbnail_path?: string | null
          extraction_confidence?: number | null
          raw_extraction?: Json | null
          status?: 'pending' | 'matched' | 'partially_matched' | 'unmatched' | 'manual'
          matched_transactions_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          business_id?: string | null
          vendor_name?: string | null
          document_date?: string | null
          document_type?: 'invoice' | 'receipt' | 'credit_note' | 'quote' | 'other' | null
          document_number?: string | null
          total_amount?: number | null
          subtotal?: number | null
          vat_amount?: number
          vat_rate?: number
          has_vat?: boolean
          currency?: string
          storage_path?: string | null
          thumbnail_path?: string | null
          extraction_confidence?: number | null
          raw_extraction?: Json | null
          status?: 'pending' | 'matched' | 'partially_matched' | 'unmatched' | 'manual'
          matched_transactions_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_rows: {
        Row: {
          id: string
          invoice_id: string
          date: string | null
          description: string | null
          quantity: number
          unit_price: number | null
          amount: number
          reference: string | null
          transaction_id: string | null
          matched: boolean
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          date?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number | null
          amount: number
          reference?: string | null
          transaction_id?: string | null
          matched?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          date?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number | null
          amount?: number
          reference?: string | null
          transaction_id?: string | null
          matched?: boolean
          created_at?: string
        }
      }
      duplicates: {
        Row: {
          id: string
          user_id: string
          original_transaction_id: string | null
          hash: string
          detected_at: string
          source_file: string | null
          date: string | null
          source: string | null
          description: string | null
          amount: number | null
          currency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_transaction_id?: string | null
          hash: string
          detected_at?: string
          source_file?: string | null
          date?: string | null
          source?: string | null
          description?: string | null
          amount?: number | null
          currency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_transaction_id?: string | null
          hash?: string
          detected_at?: string
          source_file?: string | null
          date?: string | null
          source?: string | null
          description?: string | null
          amount?: number | null
          currency?: string | null
          created_at?: string
        }
      }
      matching_rules: {
        Row: {
          id: string
          user_id: string
          name: string
          priority: number
          is_active: boolean
          conditions: Json
          auto_match: boolean
          assign_business_id: string | null
          assign_category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          priority?: number
          is_active?: boolean
          conditions: Json
          auto_match?: boolean
          assign_business_id?: string | null
          assign_category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          priority?: number
          is_active?: boolean
          conditions?: Json
          auto_match?: boolean
          assign_business_id?: string | null
          assign_category_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
