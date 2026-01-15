"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DateRange } from "../DateRangePicker";
import { DeleteConfirmModal } from "../DeleteConfirmModal";
import { CreditCardDetectionModal } from "../CreditCardDetectionModal";
import { DuplicateTransactionModal } from "../DuplicateTransactionModal";
import { FilesTableToolbar } from "./FilesTableToolbar";
import { FilesTableHeader } from "./FilesTableHeader";
import { FilesTableRow } from "./FilesTableRow";
import { FilesTableSkeleton } from "./FilesTableSkeleton";
import { EmptyState } from "./EmptyState";
import { TransactionsDrawer } from "./TransactionsDrawer";
import { FilePreviewModal } from "./FilePreviewModal";
import { FileRenameModal } from "./FileRenameModal";
import {
  FileWithStats,
  FilesTableProps,
  SortColumn,
  SortOrder,
} from "./types";
import {
  ProcessingResult,
  CreditCard,
  DetectedCreditCardPayment,
  DuplicateTransaction,
  DuplicateAction,
} from "@/lib/processors/types";

const ITEMS_PER_PAGE = 20;

export function FilesTable({ sourceType, refreshTrigger }: FilesTableProps) {
  // Data state
  const [files, setFiles] = useState<FileWithStats[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & sort state
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [sortBy, setSortBy] = useState<SortColumn>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [drawerFile, setDrawerFile] = useState<FileWithStats | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithStats | null>(null);
  const [renameFile, setRenameFile] = useState<FileWithStats | null>(null);
  const [deleteFile, setDeleteFile] = useState<FileWithStats | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Processing modal state
  const [creditCardPayments, setCreditCardPayments] = useState<DetectedCreditCardPayment[]>([]);
  const [duplicateTransactions, setDuplicateTransactions] = useState<DuplicateTransaction[]>([]);
  const [existingCreditCards, setExistingCreditCards] = useState<CreditCard[]>([]);
  const [processingFile, setProcessingFile] = useState<FileWithStats | null>(null);

  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch files
  const fetchFiles = useCallback(
    async (cursor?: string | null, append = false) => {
      if (!append) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          source_type: sourceType,
          limit: ITEMS_PER_PAGE.toString(),
          sort: sortBy,
          order: sortOrder,
        });

        if (cursor) {
          params.append("cursor", cursor);
        }

        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        const response = await fetch(`/api/files?${params}`);
        if (!response.ok) throw new Error("Failed to fetch files");

        const data = await response.json();

        if (append) {
          setFiles((prev) => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sourceType, sortBy, sortOrder, dateRange]
  );

  // Initial fetch and refetch on filter/sort change
  useEffect(() => {
    setSelectedIds(new Set());
    fetchFiles();
  }, [fetchFiles]);

  // Refetch when refreshTrigger changes (after upload)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchFiles();
    }
  }, [refreshTrigger, fetchFiles]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore || isInitialLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchFiles(nextCursor, true);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isInitialLoading, nextCursor, fetchFiles]);

  // Sort handler
  const handleSort = useCallback((column: SortColumn) => {
    setSortOrder((prev) =>
      sortBy === column ? (prev === "asc" ? "desc" : "asc") : "desc"
    );
    setSortBy(column);
  }, [sortBy]);

  // Selection handlers
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedIds(new Set(files.map((f) => f.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [files]
  );

  const handleSelectFile = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Action handlers
  const handleRename = useCallback(async (newName: string) => {
    if (!renameFile) return;

    const response = await fetch(`/api/files/${renameFile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: newName }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to rename file");
    }

    // Update local state
    setFiles((prev) =>
      prev.map((f) =>
        f.id === renameFile.id ? { ...f, filename: newName } : f
      )
    );
  }, [renameFile]);

  const handleDelete = useCallback(async () => {
    if (!deleteFile) return;

    const response = await fetch(`/api/files/${deleteFile.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete file");
    }

    // Remove from local state
    setFiles((prev) => prev.filter((f) => f.id !== deleteFile.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteFile.id);
      return next;
    });
    setTotalCount((prev) => prev - 1);
  }, [deleteFile]);

  const handleBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);

    // Delete all selected files
    await Promise.all(
      idsToDelete.map((id) =>
        fetch(`/api/files/${id}`, { method: "DELETE" })
      )
    );

    // Update local state
    setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setTotalCount((prev) => prev - selectedIds.size);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleReprocess = useCallback(async (file: FileWithStats) => {
    // Update local state to show processing
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? { ...f, status: "pending", error_message: null }
          : f
      )
    );
    setProcessingFile(file);

    try {
      // Use /process for new files, /reprocess for re-processing
      const endpoint = file.status === "uploaded"
        ? `/api/files/${file.id}/process`
        : `/api/files/${file.id}/reprocess`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "failed", error_message: errorData.error || "Processing failed" }
              : f
          )
        );
        return;
      }

      const result: ProcessingResult = await response.json();

      // Update file status based on result
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: result.status,
                items_count: result.itemsCount,
                error_message: result.error || null,
              }
            : f
        )
      );

      // Show credit card detection modal if payments found (only for bank source type)
      if (result.creditCardPaymentsFound && result.creditCardPaymentsFound.length > 0) {
        setCreditCardPayments(result.creditCardPaymentsFound);
        // Fetch existing credit cards
        const cardsResponse = await fetch("/api/credit-cards");
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          setExistingCreditCards(cardsData.cards || []);
        }
      }

      // Show duplicates modal if duplicates found
      if (result.duplicatesFound && result.duplicatesFound.length > 0) {
        setDuplicateTransactions(result.duplicatesFound);
      }
    } catch (error) {
      console.error("Processing error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: "failed", error_message: "Processing failed" }
            : f
        )
      );
    } finally {
      setProcessingFile(null);
    }
  }, []);

  const handleBulkReprocess = useCallback(async () => {
    const idsToReprocess = Array.from(selectedIds);

    await Promise.all(
      idsToReprocess.map((id) =>
        fetch(`/api/files/${id}/reprocess`, { method: "POST" })
      )
    );

    // Update local state
    setFiles((prev) =>
      prev.map((f) =>
        selectedIds.has(f.id)
          ? { ...f, status: "pending", error_message: null, items_count: 0 }
          : f
      )
    );
    setSelectedIds(new Set());
  }, [selectedIds]);

  // Credit card modal handlers
  const handleCreditCardConfirm = useCallback(
    async (assignments: Map<number, string | null>) => {
      // TODO: Save credit card assignments to transactions
      // For now, just close the modal
      console.log("Credit card assignments:", Object.fromEntries(assignments));
      setCreditCardPayments([]);
    },
    []
  );

  const handleCreateCreditCard = useCallback(
    async (card: Omit<CreditCard, "id" | "userId">): Promise<CreditCard> => {
      const response = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        throw new Error("Failed to create credit card");
      }

      const data = await response.json();
      return data.card;
    },
    []
  );

  // Duplicate modal handlers
  const handleDuplicateConfirm = useCallback(
    async (actions: Map<string, DuplicateAction>) => {
      // TODO: Handle duplicate actions (add_anyway, replace)
      // For now, just close the modal
      console.log("Duplicate actions:", Object.fromEntries(actions));
      setDuplicateTransactions([]);
    },
    []
  );

  // Computed values
  const allSelected = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < files.length;
  const hasDateFilter = dateRange.from !== null || dateRange.to !== null;

  // Determine empty state type
  const getEmptyStateType = () => {
    if (error) return "error";
    if (hasDateFilter && files.length === 0) return "no-results";
    return "no-files";
  };

  return (
    <div ref={containerRef}>
      {/* Toolbar */}
      <FilesTableToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedCount={selectedIds.size}
        onDeleteSelected={() => setShowBulkDelete(true)}
        onReprocessSelected={handleBulkReprocess}
        onClearSelection={() => setSelectedIds(new Set())}
        totalCount={totalCount}
      />

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <FilesTableHeader
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={handleSelectAll}
          />

          <tbody>
            {isInitialLoading ? (
              <FilesTableSkeleton rows={5} />
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    type={getEmptyStateType()}
                    sourceType={sourceType}
                    onClearFilters={() => setDateRange({ from: null, to: null })}
                    onRetry={() => fetchFiles()}
                  />
                </td>
              </tr>
            ) : (
              <>
                {files.map((file) => (
                  <FilesTableRow
                    key={file.id}
                    file={file}
                    selected={selectedIds.has(file.id)}
                    onSelect={(selected) => handleSelectFile(file.id, selected)}
                    onRowClick={() => setPreviewFile(file)}
                    onExtractedClick={() => setDrawerFile(file)}
                    onRename={() => setRenameFile(file)}
                    onReprocess={() => handleReprocess(file)}
                    onDelete={() => setDeleteFile(file)}
                  />
                ))}
                {isLoadingMore && <FilesTableSkeleton rows={3} />}
              </>
            )}
          </tbody>
        </table>

        {/* Load more trigger */}
        {hasMore && !isInitialLoading && files.length > 0 && (
          <div ref={loadMoreRef} className="h-1" />
        )}
      </div>

      {/* Transactions/Invoice Rows Drawer */}
      <TransactionsDrawer
        isOpen={drawerFile !== null}
        onClose={() => setDrawerFile(null)}
        file={drawerFile}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* Rename Modal */}
      <FileRenameModal
        isOpen={renameFile !== null}
        onClose={() => setRenameFile(null)}
        currentName={renameFile?.filename || ""}
        onRename={handleRename}
      />

      {/* Single Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteFile !== null}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDelete}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteFile?.filename}"?`}
        warningText={
          deleteFile && deleteFile.items_count > 0
            ? `This will also delete ${deleteFile.items_count} ${
                deleteFile.source_type === "invoice" ? "invoice rows" : "transactions"
              } extracted from this file.`
            : undefined
        }
      />

      {/* Bulk Delete Modal */}
      <DeleteConfirmModal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Delete Files"
        description={`Are you sure you want to delete ${selectedIds.size} file${
          selectedIds.size !== 1 ? "s" : ""
        }?`}
        warningText="This will also delete all data extracted from these files."
        confirmLabel={`Delete ${selectedIds.size} file${selectedIds.size !== 1 ? "s" : ""}`}
      />

      {/* Credit Card Detection Modal */}
      <CreditCardDetectionModal
        isOpen={creditCardPayments.length > 0}
        payments={creditCardPayments}
        existingCards={existingCreditCards}
        onConfirm={handleCreditCardConfirm}
        onCreateCard={handleCreateCreditCard}
        onClose={() => setCreditCardPayments([])}
      />

      {/* Duplicate Transactions Modal */}
      <DuplicateTransactionModal
        isOpen={duplicateTransactions.length > 0}
        duplicates={duplicateTransactions}
        onConfirm={handleDuplicateConfirm}
        onClose={() => setDuplicateTransactions([])}
      />
    </div>
  );
}

export type { FilesTableProps, FileWithStats, SourceType } from "./types";
