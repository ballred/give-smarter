export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Reports</h1>
        <p className="text-sm text-stone-600">
          View finance, auction, and attendance reports.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            Export ledger-backed transactions and payouts.
          </p>
          <a
            href="/admin/reports/finance"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Finance report
          </a>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            Export attendance and check-in status for event teams.
          </p>
          <a
            href="/admin/reports/attendance"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Attendance report
          </a>
        </div>
      </div>
    </div>
  );
}
