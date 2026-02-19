export default function DonorRecurringPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">
          Recurring gifts
        </h1>
        <p className="text-sm text-stone-600">
          Manage scheduled donations and saved payment methods.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
        Active and paused recurring gifts will appear here once enabled.
      </div>
    </div>
  );
}
