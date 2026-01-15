"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { FilesTable } from "@/components/ui/FilesTable";

export default function CreditCardUploadsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Credit Card Transactions</h1>
      <p className="text-foreground-muted mb-6">
        Upload your credit card statement exports to import transactions
      </p>

      <FileUpload
        title="Drop credit card statements here"
        description="Drag and drop your credit card export files, or click to browse"
        acceptedTypes={[".csv", ".xlsx", ".xls"]}
        acceptLabel="CSV, Excel files"
        sourceType="credit_card"
        onUploadComplete={handleUploadComplete}
      />

      <div className="h-6" />

      <FilesTable sourceType="credit_card" refreshTrigger={refreshTrigger} />
    </div>
  );
}
