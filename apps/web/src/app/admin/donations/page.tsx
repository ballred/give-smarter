import Link from "next/link";

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Donations</h1>
        <p className="text-sm text-stone-600">
          Configure donation forms, recurring giving, and text-to-give.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Donation forms</h2>
          <p className="mt-2 text-sm text-stone-600">
            Build embeddable forms and preset giving levels.
          </p>
          <Link
            href="/admin/donations/forms"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Configure forms
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">
            Text-to-give keywords
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Route keywords to campaigns and configure auto-replies.
          </p>
          <Link
            href="/admin/donations/keywords"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Manage keywords
          </Link>
        </div>
      </div>
    </div>
  );
}
