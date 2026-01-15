"use client";

import { useCallback, useState } from "react";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface UploadedFile {
  file: File;
  id: string;
}

interface FileUploadProps {
  title: string;
  description: string;
  acceptedTypes: string[];
  acceptLabel: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  maxSizeMB?: number;
}

export function FileUpload({
  title,
  description,
  acceptedTypes,
  acceptLabel,
  multiple = true,
  onFilesSelected,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const maxSize = maxSizeMB * 1024 * 1024;

      Array.from(fileList).forEach((file) => {
        // Check file type
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isValidType = acceptedTypes.some(
          (type) => type === fileExt || file.type.includes(type.replace(".", ""))
        );

        if (!isValidType) {
          setError(`Invalid file type: ${file.name}`);
          return;
        }

        // Check file size
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
        const newFiles = validFiles.map((file) => ({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        }));

        if (multiple) {
          setFiles((prev) => [...prev, ...newFiles]);
        } else {
          setFiles(newFiles.slice(0, 1));
        }

        onFilesSelected(validFiles);
      }
    },
    [validateFiles, multiple, onFilesSelected]
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

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return (
    <div className="w-full">
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

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-foreground-muted hover:text-error transition-colors"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2">
            {files.map(({ file, id }) => (
              <li
                key={id}
                className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg border border-border"
              >
                <DocumentIcon className="w-5 h-5 text-foreground-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(id)}
                  className="p-1 hover:bg-background-hover rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-foreground-muted hover:text-error" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
