"use client";

import { TrashIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DateRangePicker, DateRange } from "../DateRangePicker";

interface FilesTableToolbarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onReprocessSelected: () => void;
  onClearSelection: () => void;
  totalCount: number;
}

export function FilesTableToolbar({
  dateRange,
  onDateRangeChange,
  selectedCount,
  onDeleteSelected,
  onReprocessSelected,
  onClearSelection,
  totalCount,
}: FilesTableToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left side - Date filter or bulk actions */}
      {hasSelection ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">
            {selectedCount} file{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={onReprocessSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-background-hover rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Reprocess
          </button>
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-foreground-muted hover:text-foreground rounded-lg transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Filter by date"
        />
      )}

      {/* Right side - Total count */}
      <span className="text-sm text-foreground-muted">
        {totalCount} file{totalCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
