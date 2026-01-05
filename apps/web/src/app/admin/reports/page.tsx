export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-600">
          View finance, auction, and attendance reports.
        </p>
      </header>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Start with finance exports, then add operational reports for auctions
          and attendance.
        </p>
        <a
          href="/admin/reports/finance"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
        >
          Finance report
        </a>
      </div>
    </div>
  );
}
