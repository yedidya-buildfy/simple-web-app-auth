export type FileStatus = "uploaded" | "pending" | "processed" | "failed";
export type SourceType = "bank" | "credit_card" | "invoice";

export interface FileWithStats {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  source_type: SourceType;
  storage_path: string;
  status: FileStatus;
  error_message: string | null;
  items_count: number;
  matched_count: number;
  processed_at: string | null;
  created_at: string;
}

export type SortColumn = "filename" | "status" | "created_at";
export type SortOrder = "asc" | "desc";

export interface FilesTableProps {
  sourceType: SourceType;
  refreshTrigger?: number;
}
