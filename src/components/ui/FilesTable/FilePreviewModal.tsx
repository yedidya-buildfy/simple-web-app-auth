"use client";

import { XMarkIcon, DocumentIcon, CogIcon } from "@heroicons/react/24/outline";
import { FileWithStats } from "./types";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileWithStats | null;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
}: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-5 h-5 text-foreground-muted" />
            <h2 className="text-lg font-semibold text-foreground truncate max-w-lg">
              {file.filename}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* File Preview Area */}
          <div className="flex-1 p-6 border-r border-border flex flex-col items-center justify-center">
            <div className="w-full h-80 bg-background-secondary rounded-lg border border-border flex flex-col items-center justify-center">
              <CogIcon className="w-12 h-12 text-foreground-muted mb-4" />
              <p className="text-foreground-muted text-sm text-center px-4">
                File preview coming soon
              </p>
              <p className="text-foreground-muted/50 text-xs text-center px-4 mt-2">
                This area will display the file content (PDF viewer, image preview, or CSV table)
              </p>
            </div>
          </div>

          {/* Extracted Data Area */}
          <div className="w-80 p-6 flex flex-col">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Extracted Data
            </h3>
            <div className="flex-1 bg-background-secondary rounded-lg border border-border flex flex-col items-center justify-center">
              <CogIcon className="w-8 h-8 text-foreground-muted mb-3" />
              <p className="text-foreground-muted text-sm text-center px-4">
                Extraction panel coming soon
              </p>
              <p className="text-foreground-muted/50 text-xs text-center px-4 mt-2">
                Review and verify extracted data here
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-foreground-muted">
            Status: <span className="capitalize">{file.status}</span>
            {file.items_count > 0 && (
              <span className="ml-3">
                {file.items_count} {file.source_type === "invoice" ? "rows" : "transactions"} extracted
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
            >
              Close
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm bg-green text-background rounded-lg opacity-50 cursor-not-allowed"
            >
              Process File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
