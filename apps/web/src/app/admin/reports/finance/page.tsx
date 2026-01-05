export default function FinanceReportPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Finance report</h1>
        <p className="text-sm text-zinc-600">
          Export ledger-backed transactions and payouts.
        </p>
      </header>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Download a CSV export once data is connected.
        </p>
        <a
          href="/api/admin/reports/finance?format=csv"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Download CSV
        </a>
      </div>
    </div>
  );
}
