"use client";

import { useState } from "react";
import {
  DocumentDuplicateIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { DuplicateTransaction, DuplicateAction } from "@/lib/processors/types";

interface DuplicateTransactionModalProps {
  isOpen: boolean;
  duplicates: DuplicateTransaction[];
  onConfirm: (actions: Map<string, DuplicateAction>) => void; // hash -> action
  onClose: () => void;
}

export function DuplicateTransactionModal({
  isOpen,
  duplicates,
  onConfirm,
  onClose,
}: DuplicateTransactionModalProps) {
  const [actions, setActions] = useState<Map<string, DuplicateAction>>(
    new Map(duplicates.map((d) => [d.hash, "skip"]))
  );

  if (!isOpen || duplicates.length === 0) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSetAction = (hash: string, action: DuplicateAction) => {
    setActions((prev) => {
      const next = new Map(prev);
      next.set(hash, action);
      return next;
    });
  };

  const handleBulkAction = (action: DuplicateAction) => {
    setActions((prev) => {
      const next = new Map(prev);
      duplicates.forEach((d) => next.set(d.hash, action));
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(actions);
  };

  const skippedCount = [...actions.values()].filter((a) => a === "skip").length;
  const addedCount = [...actions.values()].filter((a) => a === "add_anyway").length;
  const replacedCount = [...actions.values()].filter((a) => a === "replace").length;

  const getActionBadge = (action: DuplicateAction) => {
    switch (action) {
      case "skip":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-foreground-muted/20 text-foreground-muted rounded-full">
            Skip
          </span>
        );
      case "add_anyway":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-green/20 text-green rounded-full">
            Add
          </span>
        );
      case "replace":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning rounded-full">
            Replace
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <DocumentDuplicateIcon className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Duplicate Transactions Found
              </h3>
              <p className="text-sm text-foreground-muted">
                {duplicates.length} transaction{duplicates.length !== 1 ? "s" : ""} already exist in your records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="px-6 py-3 border-b border-border bg-background-secondary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Apply to all:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("skip")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-background-hover transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Skip All
              </button>
              <button
                onClick={() => handleBulkAction("add_anyway")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green border border-green/30 rounded-lg hover:bg-green/10 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add All
              </button>
              <button
                onClick={() => handleBulkAction("replace")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warning border border-warning/30 rounded-lg hover:bg-warning/10 transition-colors"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                Replace All
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {duplicates.map((duplicate) => {
              const currentAction = actions.get(duplicate.hash) || "skip";

              return (
                <div
                  key={duplicate.hash}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* New Transaction */}
                  <div className="p-4 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-green uppercase tracking-wide">
                          New
                        </span>
                        {getActionBadge(currentAction)}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSetAction(duplicate.hash, "skip")}
                          className={`p-1.5 rounded-md transition-colors ${
                            currentAction === "skip"
                              ? "bg-foreground-muted/20 text-foreground"
                              : "text-foreground-muted hover:text-foreground hover:bg-background-hover"
                          }`}
                          title="Skip (don't import)"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSetAction(duplicate.hash, "add_anyway")}
                          className={`p-1.5 rounded-md transition-colors ${
                            currentAction === "add_anyway"
                              ? "bg-green/20 text-green"
                              : "text-foreground-muted hover:text-green hover:bg-green/10"
                          }`}
                          title="Add anyway (keep both)"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSetAction(duplicate.hash, "replace")}
                          className={`p-1.5 rounded-md transition-colors ${
                            currentAction === "replace"
                              ? "bg-warning/20 text-warning"
                              : "text-foreground-muted hover:text-warning hover:bg-warning/10"
                          }`}
                          title="Replace existing"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-foreground">
                        {duplicate.newTransaction.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
                        <span>{formatDate(duplicate.newTransaction.date)}</span>
                        <span
                          className={
                            duplicate.newTransaction.direction === "debit"
                              ? "text-error"
                              : "text-green"
                          }
                        >
                          {duplicate.newTransaction.direction === "debit" ? "-" : "+"}
                          {formatCurrency(Math.abs(duplicate.newTransaction.amount))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="px-4 py-1 bg-background-secondary border-t border-b border-border">
                    <span className="text-xs text-foreground-muted">
                      matches existing record:
                    </span>
                  </div>

                  {/* Existing Transaction */}
                  <div className="p-4 bg-background-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                        Existing
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {duplicate.existingTransaction.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
                      <span>{formatDate(duplicate.existingTransaction.date)}</span>
                      <span>{formatCurrency(duplicate.existingTransaction.amount)}</span>
                      <span>from {duplicate.existingTransaction.fileName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-background-secondary rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-foreground-muted">
              <span>
                <span className="font-medium text-foreground">{skippedCount}</span> skip
              </span>
              <span>
                <span className="font-medium text-green">{addedCount}</span> add
              </span>
              <span>
                <span className="font-medium text-warning">{replacedCount}</span> replace
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-foreground font-medium rounded-lg border border-border hover:bg-background-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green text-background font-medium rounded-lg hover:bg-green/90 transition-colors"
              >
                Apply Actions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
