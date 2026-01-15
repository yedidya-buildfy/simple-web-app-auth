"use client";

import { useState, useRef, useEffect } from "react";
import {
  EllipsisVerticalIcon,
  PencilIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { FileWithStats, SourceType } from "./types";

interface FilesTableRowProps {
  file: FileWithStats;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onRowClick: () => void;
  onExtractedClick: () => void;
  onRename: () => void;
  onReprocess: () => void;
  onDelete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getExtractedLabel(sourceType: SourceType, count: number): string {
  if (sourceType === "invoice") {
    if (count === 0) return "No rows";
    return count === 1 ? "1 row" : `${count} rows`;
  }
  if (count === 0) return "No transactions";
  return count === 1 ? "1 transaction" : `${count} transactions`;
}

interface StatusBadgeProps {
  status: FileWithStats["status"];
  errorMessage?: string | null;
}

function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full";

  if (status === "uploaded") {
    return (
      <span className={`${baseClasses} bg-foreground-muted/10 text-foreground-muted`}>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
        Uploaded
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className={`${baseClasses} bg-yellow-500/10 text-yellow-500`}>
        <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        Processing
      </span>
    );
  }

  if (status === "processed") {
    return (
      <span className={`${baseClasses} bg-green/10 text-green`}>
        <div className="w-1.5 h-1.5 rounded-full bg-green" />
        Processed
      </span>
    );
  }

  // Failed status with tooltip
  return (
    <div className="relative">
      <span
        className={`${baseClasses} bg-error/10 text-error cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-error" />
        Failed
      </span>
      {showTooltip && errorMessage && (
        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 text-xs bg-background border border-border rounded-lg shadow-lg max-w-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

interface MatchedProgressProps {
  matched: number;
  total: number;
}

function MatchedProgress({ matched, total }: MatchedProgressProps) {
  if (total === 0) {
    return <span className="text-sm text-foreground-muted">-</span>;
  }

  const percentage = Math.round((matched / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground">
        {matched}/{total}
      </span>
      <div className="w-12 h-1.5 bg-background-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-green transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function FilesTableRow({
  file,
  selected,
  onSelect,
  onRowClick,
  onExtractedClick,
  onRename,
  onReprocess,
  onDelete,
}: FilesTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox, menu, or extracted link
    const target = e.target as HTMLElement;
    if (
      target.closest("input[type='checkbox']") ||
      target.closest("[data-menu]") ||
      target.closest("[data-extracted]")
    ) {
      return;
    }
    onRowClick();
  };

  return (
    <tr
      className="border-b border-border hover:bg-background-hover/50 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-12">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4"
        />
      </td>

      {/* Filename */}
      <td className="px-4 py-3">
        <span
          className="text-sm text-foreground truncate block max-w-xs"
          title={file.filename}
        >
          {file.filename}
        </span>
      </td>

      {/* Size */}
      <td className="px-4 py-3 w-20">
        <span className="text-sm text-foreground-muted">
          {formatFileSize(file.file_size)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 w-28">
        <StatusBadge status={file.status} errorMessage={file.error_message} />
      </td>

      {/* Extracted */}
      <td className="px-4 py-3 w-32">
        <button
          data-extracted
          onClick={(e) => {
            e.stopPropagation();
            onExtractedClick();
          }}
          className="text-sm text-green hover:underline"
          disabled={file.items_count === 0}
        >
          {getExtractedLabel(file.source_type, file.items_count)}
        </button>
      </td>

      {/* Matched */}
      <td className="px-4 py-3 w-28">
        <MatchedProgress matched={file.matched_count} total={file.items_count} />
      </td>

      {/* Uploaded */}
      <td className="px-4 py-3 w-28">
        <span
          className="text-sm text-foreground-muted"
          title={new Date(file.created_at).toLocaleString()}
        >
          {formatRelativeTime(file.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 w-14">
        <div className="relative" ref={menuRef} data-menu>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-32">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-hover"
              >
                <PencilIcon className="w-4 h-4" />
                Rename
              </button>
              {file.status === "uploaded" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onReprocess();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green hover:bg-green/10"
                >
                  <PlayIcon className="w-4 h-4" />
                  Process
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onReprocess();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-hover"
                  disabled={file.status === "pending"}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reprocess
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
