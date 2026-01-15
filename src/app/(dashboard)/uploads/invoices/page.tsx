"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";

export default function InvoicesUploadsPage() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    // TODO: Upload invoices and trigger AI extraction
    console.log("Processing invoice files:", files);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Invoices & Receipts</h1>
      <p className="text-foreground-muted mb-6">
        Upload invoices and receipts for AI-powered data extraction
      </p>

      <div className="max-w-2xl">
        <FileUpload
          title="Drop invoices here"
          description="Drag and drop your invoices or receipts, or click to browse"
          acceptedTypes={[".pdf", ".png", ".jpg", ".jpeg", ".webp"]}
          acceptLabel="PDF, PNG, JPG, WEBP"
          onFilesSelected={handleFilesSelected}
        />

        {files.length > 0 && (
          <div className="mt-6">
            <Button onClick={handleUpload} className="w-full">
              Upload & Extract {files.length} file{files.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
