export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      files: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_size: number | null
          file_type: string
          filename: string
          id: string
          items_count: number | null
          processed_at: string | null
          source_type: string
          status: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          items_count?: number | null
          processed_at?: string | null
          source_type: string
          status?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          items_count?: number | null
          processed_at?: string | null
          source_type?: string
          status?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_rows: {
        Row: {
          created_at: string | null
          currency: string | null
          date: string | null
          description: string | null
          id: string
          invoice_id: string
          matched: boolean | null
          reference: string | null
          subtotal: number
          total: number | null
          transaction_id: string | null
          vat_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          matched?: boolean | null
          reference?: string | null
          subtotal: number
          total?: number | null
          transaction_id?: string | null
          vat_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          matched?: boolean | null
          reference?: string | null
          subtotal?: number
          total?: number | null
          transaction_id?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_rows_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_rows_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          currency: string | null
          document_number: string | null
          document_type: string | null
          due_date: string | null
          extracted_subtotal: number | null
          extracted_total: number | null
          extracted_vat: number | null
          extraction_confidence: number | null
          file_id: string | null
          id: string
          is_consolidated: boolean | null
          issue_date: string | null
          raw_extraction: Json | null
          stated_total: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          vat_rate: number | null
          vendor_name: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          currency?: string | null
          document_number?: string | null
          document_type?: string | null
          due_date?: string | null
          extracted_subtotal?: number | null
          extracted_total?: number | null
          extracted_vat?: number | null
          extraction_confidence?: number | null
          file_id?: string | null
          id?: string
          is_consolidated?: boolean | null
          issue_date?: string | null
          raw_extraction?: Json | null
          stated_total?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          vat_rate?: number | null
          vendor_name?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          currency?: string | null
          document_number?: string | null
          document_type?: string | null
          due_date?: string | null
          extracted_subtotal?: number | null
          extracted_total?: number | null
          extracted_vat?: number | null
          extraction_confidence?: number | null
          file_id?: string | null
          id?: string
          is_consolidated?: boolean | null
          issue_date?: string | null
          raw_extraction?: Json | null
          stated_total?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          vat_rate?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          direction: string
          file_id: string | null
          hash: string
          id: string
          match_quality: string | null
          notes: string | null
          reference: string | null
          source: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          date: string
          description?: string | null
          direction: string
          file_id?: string | null
          hash: string
          id?: string
          match_quality?: string | null
          notes?: string | null
          reference?: string | null
          source: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          direction?: string
          file_id?: string | null
          hash?: string
          id?: string
          match_quality?: string | null
          notes?: string | null
          reference?: string | null
          source?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          date_format: string | null
          default_currency: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_format?: string | null
          default_currency?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_format?: string | null
          default_currency?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
