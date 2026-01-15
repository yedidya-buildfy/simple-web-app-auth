import { createClient } from "@/lib/supabase/server";
import {
  BanknotesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Get all transactions
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId);

  // Get all invoices
  const { data: invoices, error: invError } = await supabase
    .from("invoices")
    .select("id")
    .eq("user_id", userId);

  // Get matched invoice rows (rows that have a transaction_id)
  const { data: matchedRows, error: rowsError } = await supabase
    .from("invoice_rows")
    .select("transaction_id, invoice_id")
    .not("transaction_id", "is", null);

  if (txError || invError || rowsError) {
    console.error("Error fetching stats:", txError || invError || rowsError);
    return {
      totalTransactions: 0,
      matchedTransactions: 0,
      unmatchedTransactions: 0,
      totalInvoices: 0,
      unmatchedInvoices: 0,
    };
  }

  // Get unique matched transaction IDs
  const matchedTransactionIds = new Set(
    (matchedRows || []).map((r) => r.transaction_id)
  );

  // Get unique matched invoice IDs
  const matchedInvoiceIds = new Set(
    (matchedRows || []).map((r) => r.invoice_id)
  );

  const totalTransactions = transactions?.length || 0;
  const matchedTransactions = matchedTransactionIds.size;
  const totalInvoices = invoices?.length || 0;
  const matchedInvoicesCount = matchedInvoiceIds.size;

  return {
    totalTransactions,
    matchedTransactions,
    unmatchedTransactions: totalTransactions - matchedTransactions,
    totalInvoices,
    unmatchedInvoices: totalInvoices - matchedInvoicesCount,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const stats = await getStats(supabase, user.id);

  const matchRate =
    stats.totalTransactions > 0
      ? Math.round((stats.matchedTransactions / stats.totalTransactions) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={BanknotesIcon}
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={DocumentTextIcon}
        />
        <StatCard
          title="Matched"
          value={stats.matchedTransactions}
          icon={CheckCircleIcon}
          iconColor="text-green"
        />
        <StatCard
          title="Match Rate"
          value={`${matchRate}%`}
          icon={CheckCircleIcon}
          iconColor="text-green"
        />
      </div>

      {/* Unmatched Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background-secondary rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationCircleIcon className="w-6 h-6 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">
              Unmatched Transactions
            </h2>
          </div>
          <p className="text-3xl font-bold text-warning">
            {stats.unmatchedTransactions}
          </p>
          <p className="text-foreground-muted mt-1">
            Transactions without invoices
          </p>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationCircleIcon className="w-6 h-6 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">
              Unmatched Invoices
            </h2>
          </div>
          <p className="text-3xl font-bold text-warning">
            {stats.unmatchedInvoices}
          </p>
          <p className="text-foreground-muted mt-1">
            Invoices without transactions
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-foreground-muted",
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <div className="bg-background-secondary rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-foreground-muted text-sm">{title}</span>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
