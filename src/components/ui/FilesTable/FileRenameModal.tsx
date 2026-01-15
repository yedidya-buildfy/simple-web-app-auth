"use client";

import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FileRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export function FileRenameModal({
  isOpen,
  onClose,
  currentName,
  onRename,
}: FileRenameModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError(null);
      // Focus and select input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select filename without extension
          const lastDot = currentName.lastIndexOf(".");
          if (lastDot > 0) {
            inputRef.current.setSelectionRange(0, lastDot);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, currentName]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Filename cannot be empty");
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onRename(trimmedName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename file");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Rename File</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded hover:bg-background-hover text-foreground-muted hover:text-foreground disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="filename"
              className="block text-sm font-medium text-foreground-muted mb-1.5"
            >
              Filename
            </label>
            <input
              ref={inputRef}
              id="filename"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className={`
                w-full px-3 py-2.5
                bg-background-secondary
                border rounded-lg
                text-foreground
                placeholder:text-foreground-muted
                focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent
                transition-all duration-200
                disabled:opacity-50
                ${error ? "border-error" : "border-border"}
              `}
            />
            {error && <p className="mt-1 text-sm text-error">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm bg-green text-background rounded-lg hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              )}
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
