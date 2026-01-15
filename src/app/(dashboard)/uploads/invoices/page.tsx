"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { FilesTable } from "@/components/ui/FilesTable";

export default function InvoicesUploadsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Invoices & Receipts</h1>
      <p className="text-foreground-muted mb-6">
        Upload invoices and receipts for AI-powered data extraction
      </p>

      <FileUpload
        title="Drop invoices here"
        description="Drag and drop your invoices or receipts, or click to browse"
        acceptedTypes={[".pdf", ".png", ".jpg", ".jpeg", ".webp"]}
        acceptLabel="PDF, PNG, JPG, WEBP"
        sourceType="invoice"
        onUploadComplete={handleUploadComplete}
      />

      <div className="h-6" />

      <FilesTable sourceType="invoice" refreshTrigger={refreshTrigger} />
    </div>
  );
}
