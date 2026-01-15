"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { DuplicateFileModal, DuplicateAction } from "./DuplicateFileModal";

type UploadStatus = "pending" | "checking" | "uploading" | "uploaded" | "error" | "duplicate";

interface UploadedFile {
  file: File;
  id: string;
  status: UploadStatus;
  error?: string;
  dbRecord?: Record<string, unknown>;
  existingFile?: {
    id: string;
    filename: string;
    file_size: number;
    created_at: string;
  };
}

interface FileUploadProps {
  title: string;
  description: string;
  acceptedTypes: string[];
  acceptLabel: string;
  sourceType: "bank" | "credit_card" | "invoice";
  multiple?: boolean;
  maxSizeMB?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export function FileUpload({
  title,
  description,
  acceptedTypes,
  acceptLabel,
  sourceType,
  multiple = true,
  maxSizeMB = 10,
  onUploadComplete,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duplicateFile, setDuplicateFile] = useState<UploadedFile | null>(null);
  const isProcessing = useRef(false);

  // Calculate progress
  const uploadedCount = files.filter((f) => f.status === "uploaded").length;
  const totalCount = files.filter((f) => f.status !== "duplicate").length;
  const progress = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const isComplete = totalCount > 0 && uploadedCount === totalCount;

  // Check for duplicate
  const checkDuplicate = useCallback(
    async (file: File): Promise<{ isDuplicate: boolean; existingFile?: UploadedFile["existingFile"] }> => {
      try {
        const params = new URLSearchParams({
          filename: file.name,
          size: file.size.toString(),
          source_type: sourceType,
        });

        const response = await fetch(`/api/files/check?${params}`);
        const result = await response.json();

        return {
          isDuplicate: result.isDuplicate,
          existingFile: result.existingFile,
        };
      } catch {
        return { isDuplicate: false };
      }
    },
    [sourceType]
  );

  // Delete existing file
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Upload a single file
  const uploadFile = useCallback(
    async (fileItem: UploadedFile): Promise<UploadedFile> => {
      const formData = new FormData();
      formData.append("file", fileItem.file);
      formData.append("source_type", sourceType);

      try {
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            ...fileItem,
            status: "error",
            error: result.error || "Upload failed",
          };
        }

        return {
          ...fileItem,
          status: "uploaded",
          dbRecord: result.file,
        };
      } catch {
        return {
          ...fileItem,
          status: "error",
          error: "Network error",
        };
      }
    },
    [sourceType]
  );

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const fileItem of pendingFiles) {
      // Mark as checking
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "checking" as UploadStatus } : f
        )
      );

      // Check for duplicate
      const { isDuplicate, existingFile } = await checkDuplicate(fileItem.file);

      if (isDuplicate && existingFile) {
        // Mark as duplicate and show modal
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "duplicate" as UploadStatus, existingFile }
              : f
          )
        );

        // Set the duplicate file to show modal
        setDuplicateFile({
          ...fileItem,
          status: "duplicate",
          existingFile,
        });

        isProcessing.current = false;
        return; // Stop processing, wait for user decision
      }

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "uploading" as UploadStatus } : f
        )
      );

      // Upload
      const result = await uploadFile(fileItem);

      // Update status
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? result : f))
      );

      // Auto-remove successful uploads after 1 second
      if (result.status === "uploaded") {
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
        }, 1000);
      }
    }

    isProcessing.current = false;
  }, [files, checkDuplicate, uploadFile]);

  // Handle duplicate action
  const handleDuplicateAction = useCallback(
    async (action: DuplicateAction) => {
      if (!duplicateFile) return;

      const fileId = duplicateFile.id;

      if (action === "cancel") {
        // Remove from queue
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setDuplicateFile(null);
        // Continue processing remaining files
        isProcessing.current = false;
        return;
      }

      if (action === "replace" && duplicateFile.existingFile) {
        // Delete existing file first
        await deleteFile(duplicateFile.existingFile.id);
      }

      // Upload the file (both "upload_anyway" and "replace" proceed with upload)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading" as UploadStatus } : f
        )
      );

      setDuplicateFile(null);

      const result = await uploadFile(duplicateFile);

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? result : f))
      );

      // Auto-remove successful uploads after 1 second
      if (result.status === "uploaded") {
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.id !== fileId));
        }, 1000);
      }

      // Continue processing remaining files
      isProcessing.current = false;
    },
    [duplicateFile, deleteFile, uploadFile]
  );

  // Auto-process when new files are added or after duplicate resolution
  useEffect(() => {
    const hasPending = files.some((f) => f.status === "pending");
    const hasDuplicate = files.some((f) => f.status === "duplicate");

    if (hasPending && !hasDuplicate && !isProcessing.current) {
      processQueue();
    }
  }, [files, processQueue]);

  // Notify parent when all uploads complete
  useEffect(() => {
    if (isComplete && onUploadComplete) {
      onUploadComplete(files);
    }
  }, [isComplete, files, onUploadComplete]);

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const maxSize = maxSizeMB * 1024 * 1024;

      Array.from(fileList).forEach((file) => {
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isValidType = acceptedTypes.some(
          (type) => type === fileExt || file.type.includes(type.replace(".", ""))
        );

        if (!isValidType) {
          setError(`Invalid file type: ${file.name}`);
          return;
        }

        if (file.size > maxSize) {
          setError(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
          return;
        }

        validFiles.push(file);
      });

      return validFiles;
    },
    [acceptedTypes, maxSizeMB]
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const validFiles = validateFiles(fileList);

      if (validFiles.length > 0) {
        const newFiles: UploadedFile[] = validFiles.map((file) => ({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          status: "pending",
        }));

        if (multiple) {
          setFiles((prev) => [...prev, ...newFiles]);
        } else {
          setFiles(newFiles.slice(0, 1));
        }
      }
    },
    [validateFiles, multiple]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const retryFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "pending" as UploadStatus, error: undefined } : f))
    );
  }, []);

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "uploaded":
        return <CheckCircleIcon className="w-5 h-5 text-green" />;
      case "error":
        return <ExclamationCircleIcon className="w-5 h-5 text-error" />;
      case "uploading":
      case "checking":
        return (
          <div className="w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
        );
      case "duplicate":
        return <ExclamationCircleIcon className="w-5 h-5 text-warning" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-border" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case "checking":
        return "Checking...";
      case "uploading":
        return "Uploading...";
      case "duplicate":
        return "Duplicate";
      default:
        return null;
    }
  };

  // Filter out files that are being handled by modal
  const visibleFiles = files.filter((f) => f.status !== "duplicate" || f.id !== duplicateFile?.id);

  return (
    <div className="w-full">
      {/* Duplicate Modal */}
      {duplicateFile && duplicateFile.existingFile && (
        <DuplicateFileModal
          isOpen={true}
          filename={duplicateFile.file.name}
          existingFile={duplicateFile.existingFile}
          onAction={handleDuplicateAction}
        />
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          ${
            dragActive
              ? "border-green bg-green/5"
              : "border-border hover:border-green/50 hover:bg-background-hover"
          }
        `}
      >
        <input
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(",")}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center text-center">
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center mb-4
              ${dragActive ? "bg-green/20" : "bg-background-hover"}
            `}
          >
            <ArrowUpTrayIcon
              className={`w-6 h-6 ${dragActive ? "text-green" : "text-foreground-muted"}`}
            />
          </div>

          <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
          <p className="text-foreground-muted text-sm mb-2">{description}</p>
          <p className="text-foreground-muted text-xs">
            {acceptLabel} (max {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {visibleFiles.length > 0 && !isComplete && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">
              Uploading... {uploadedCount}/{totalCount}
            </span>
            <span className="text-sm text-foreground-muted">{progress}%</span>
          </div>
          <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-green transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* File List */}
      {visibleFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">
              {visibleFiles.length} file{visibleFiles.length !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="space-y-2">
            {visibleFiles.map(({ file, id, status, error: fileError }) => (
              <li
                key={id}
                className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg border border-border"
              >
                <DocumentIcon className="w-5 h-5 text-foreground-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  {fileError ? (
                    <p className="text-xs text-error">{fileError}</p>
                  ) : getStatusText(status) ? (
                    <p className="text-xs text-foreground-muted">{getStatusText(status)}</p>
                  ) : (
                    <p className="text-xs text-foreground-muted">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  {status === "error" && (
                    <button
                      onClick={() => retryFile(id)}
                      className="text-xs text-green hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
