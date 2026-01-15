import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
