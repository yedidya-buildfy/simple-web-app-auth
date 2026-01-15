"use client";

import {
  DocumentPlusIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { SourceType } from "./types";

interface EmptyStateProps {
  type: "no-files" | "no-results" | "error";
  sourceType: SourceType;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

const sourceLabels: Record<SourceType, string> = {
  bank: "bank statement",
  credit_card: "credit card statement",
  invoice: "invoice or receipt",
};

export function EmptyState({
  type,
  sourceType,
  onClearFilters,
  onRetry,
}: EmptyStateProps) {
  if (type === "no-files") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-background-hover flex items-center justify-center mb-4">
          <DocumentPlusIcon className="w-6 h-6 text-foreground-muted" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No files yet</h3>
        <p className="text-foreground-muted text-sm">
          Drop files above to upload your first {sourceLabels[sourceType]}
        </p>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-background-hover flex items-center justify-center mb-4">
          <FunnelIcon className="w-6 h-6 text-foreground-muted" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No files found</h3>
        <p className="text-foreground-muted text-sm mb-4">
          Try adjusting your date range filter
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-green hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-error" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        Failed to load files
      </h3>
      <p className="text-foreground-muted text-sm mb-4">
        Something went wrong while fetching your files
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-green hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
