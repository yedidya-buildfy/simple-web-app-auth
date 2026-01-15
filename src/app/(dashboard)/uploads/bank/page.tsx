"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { FilesTable } from "@/components/ui/FilesTable";

export default function BankUploadsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Bank Transactions</h1>
      <p className="text-foreground-muted mb-6">
        Upload your bank statement exports to import transactions
      </p>

      <FileUpload
        title="Drop bank statements here"
        description="Drag and drop your bank export files, or click to browse"
        acceptedTypes={[".csv", ".xlsx", ".xls"]}
        acceptLabel="CSV, Excel files"
        sourceType="bank"
        onUploadComplete={handleUploadComplete}
      />

      <div className="h-6" />

      <FilesTable sourceType="bank" refreshTrigger={refreshTrigger} />
    </div>
  );
}
