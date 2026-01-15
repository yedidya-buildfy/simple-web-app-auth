"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export type DuplicateAction = "cancel" | "upload_anyway" | "replace";

interface ExistingFile {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
}

interface DuplicateFileModalProps {
  isOpen: boolean;
  filename: string;
  existingFile: ExistingFile;
  onAction: (action: DuplicateAction) => void;
}

export function DuplicateFileModal({
  isOpen,
  filename,
  existingFile,
  onAction,
}: DuplicateFileModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onAction("cancel")}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Duplicate File Detected
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              A file with this name already exists
            </p>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-background-secondary rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-foreground truncate mb-2">
            {filename}
          </p>
          <p className="text-xs text-foreground-muted">
            Uploaded on {formatDate(existingFile.created_at)} ({formatSize(existingFile.file_size)})
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onAction("replace")}
            className="w-full px-4 py-2.5 bg-green text-background font-medium rounded-lg hover:bg-green/90 transition-colors"
          >
            Replace Existing File
          </button>
          <button
            onClick={() => onAction("upload_anyway")}
            className="w-full px-4 py-2.5 bg-background-secondary text-foreground font-medium rounded-lg border border-border hover:bg-background-hover transition-colors"
          >
            Upload Anyway (Keep Both)
          </button>
          <button
            onClick={() => onAction("cancel")}
            className="w-full px-4 py-2.5 text-foreground-muted font-medium rounded-lg hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
