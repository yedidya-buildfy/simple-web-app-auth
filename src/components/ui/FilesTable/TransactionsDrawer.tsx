"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FileWithStats, SourceType } from "./types";

interface TransactionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileWithStats | null;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  direction: string;
}

interface InvoiceRow {
  id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  invoice: {
    vendor_name: string | null;
    document_number: string | null;
  } | null;
}

function formatCurrency(amount: number, currency: string = "ILS"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TransactionsDrawer({
  isOpen,
  onClose,
  file,
}: TransactionsDrawerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setTransactions([]);
      setInvoiceRows([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (file.source_type === "bank" || file.source_type === "credit_card") {
          const response = await fetch(`/api/files/${file.id}/transactions`);
          if (!response.ok) throw new Error("Failed to fetch transactions");
          const data = await response.json();
          setTransactions(data.transactions || []);
        } else {
          const response = await fetch(`/api/files/${file.id}/invoice-rows`);
          if (!response.ok) throw new Error("Failed to fetch invoice rows");
          const data = await response.json();
          setInvoiceRows(data.invoiceRows || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, file]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isInvoice = file?.source_type === "invoice";
  const title = isInvoice ? "Invoice Rows" : "Transactions";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            {file && (
              <p className="text-sm text-foreground-muted truncate max-w-64">
                {file.filename}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-background-hover rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {!loading && !error && !isInvoice && transactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-foreground-muted">No transactions found</p>
            </div>
          )}

          {!loading && !error && isInvoice && invoiceRows.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-foreground-muted">No invoice rows found</p>
            </div>
          )}

          {/* Transactions list */}
          {!loading && !error && !isInvoice && transactions.length > 0 && (
            <ul className="space-y-2">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="p-3 bg-background-secondary rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        tx.direction === "credit" ? "text-green" : "text-foreground"
                      }`}
                    >
                      {tx.direction === "credit" ? "+" : "-"}
                      {formatCurrency(Math.abs(tx.amount), tx.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Invoice rows list */}
          {!loading && !error && isInvoice && invoiceRows.length > 0 && (
            <ul className="space-y-2">
              {invoiceRows.map((row) => (
                <li
                  key={row.id}
                  className="p-3 bg-background-secondary rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {row.description || "No description"}
                      </p>
                      {row.invoice?.vendor_name && (
                        <p className="text-xs text-foreground-muted">
                          {row.invoice.vendor_name}
                        </p>
                      )}
                    </div>
                    {row.total !== null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(row.total)}
                      </span>
                    )}
                  </div>
                  {row.quantity !== null && row.unit_price !== null && (
                    <p className="text-xs text-foreground-muted mt-1">
                      {row.quantity} × {formatCurrency(row.unit_price)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
