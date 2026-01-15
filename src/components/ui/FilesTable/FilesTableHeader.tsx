"use client";

import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { SortColumn, SortOrder } from "./types";

interface FilesTableHeaderProps {
  sortBy: SortColumn;
  sortOrder: SortOrder;
  onSort: (column: SortColumn) => void;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (selected: boolean) => void;
}

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  currentSort: SortColumn;
  sortOrder: SortOrder;
  onSort: (column: SortColumn) => void;
  className?: string;
}

function SortableHeader({
  column,
  label,
  currentSort,
  sortOrder,
  onSort,
  className = "",
}: SortableHeaderProps) {
  const isActive = currentSort === column;

  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 text-xs font-medium text-foreground-muted uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {label}
        <span className="flex flex-col">
          <ChevronUpIcon
            className={`w-3 h-3 -mb-1 ${
              isActive && sortOrder === "asc"
                ? "text-green"
                : "text-foreground-muted/30"
            }`}
          />
          <ChevronDownIcon
            className={`w-3 h-3 ${
              isActive && sortOrder === "desc"
                ? "text-green"
                : "text-foreground-muted/30"
            }`}
          />
        </span>
      </button>
    </th>
  );
}

export function FilesTableHeader({
  sortBy,
  sortOrder,
  onSort,
  allSelected,
  someSelected,
  onSelectAll,
}: FilesTableHeaderProps) {
  return (
    <thead className="border-b border-border bg-background-secondary/50">
      <tr>
        {/* Checkbox */}
        <th className="px-4 py-3 w-12">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4"
          />
        </th>

        {/* Filename - Sortable */}
        <SortableHeader
          column="filename"
          label="Filename"
          currentSort={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />

        {/* Size */}
        <th className="px-4 py-3 w-20 text-left">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            Size
          </span>
        </th>

        {/* Status - Sortable */}
        <SortableHeader
          column="status"
          label="Status"
          currentSort={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-28"
        />

        {/* Extracted */}
        <th className="px-4 py-3 w-32 text-left">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            Extracted
          </span>
        </th>

        {/* Matched */}
        <th className="px-4 py-3 w-28 text-left">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            Matched
          </span>
        </th>

        {/* Uploaded - Sortable */}
        <SortableHeader
          column="created_at"
          label="Uploaded"
          currentSort={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-28"
        />

        {/* Actions */}
        <th className="px-4 py-3 w-14">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}
