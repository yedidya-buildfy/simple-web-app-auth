"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";

export default function CreditCardUploadsPage() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    // TODO: Process credit card files
    console.log("Processing credit card files:", files);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Credit Card Transactions</h1>
      <p className="text-foreground-muted mb-6">
        Upload your credit card statement exports to import transactions
      </p>

      <div className="max-w-2xl">
        <FileUpload
          title="Drop credit card statements here"
          description="Drag and drop your credit card export files, or click to browse"
          acceptedTypes={[".csv", ".xlsx", ".xls"]}
          acceptLabel="CSV, Excel files"
          onFilesSelected={handleFilesSelected}
        />

        {files.length > 0 && (
          <div className="mt-6">
            <Button onClick={handleUpload} className="w-full">
              Process {files.length} file{files.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
