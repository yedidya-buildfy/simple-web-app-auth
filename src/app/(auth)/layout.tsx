import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green">InvoiceMatch</h1>
          <p className="text-foreground-muted mt-2">
            Match transactions to invoices with AI
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
