export default function DonorPortalHome() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Your giving</h1>
        <p className="text-sm text-zinc-600">
          Review tickets, bids, receipts, and recurring gifts in one place.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Tickets</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Access QR codes and manage guest info.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Receipts</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Download receipts and year-end summaries.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Bids</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Track your winning bids and outstanding invoices.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recurring</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Manage recurring gifts and saved payment methods.
          </p>
        </div>
      </div>
    </div>
  );
}
