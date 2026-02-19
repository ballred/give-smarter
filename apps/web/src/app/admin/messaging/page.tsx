import Link from "next/link";

export default function MessagingPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Messaging</h1>
        <p className="text-sm text-stone-600">
          Create templates, manage segments, and review send history.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">
            Email templates
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Build branded emails with variables and approval workflows.
          </p>
          <Link
            href="/admin/messaging/email"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Manage email
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">SMS templates</h2>
          <p className="mt-2 text-sm text-stone-600">
            Draft concise texts for outbid alerts and announcements.
          </p>
          <Link
            href="/admin/messaging/sms"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Manage SMS
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Send history</h2>
          <p className="mt-2 text-sm text-stone-600">
            Track queued, sent, and delivered messages.
          </p>
          <Link
            href="/admin/messaging/sends"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            View sends
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Segments</h2>
          <p className="mt-2 text-sm text-stone-600">
            Build reusable donor and attendee segments.
          </p>
          <Link
            href="/admin/messaging/segments"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
          >
            Manage segments
          </Link>
        </div>
      </div>
    </div>
  );
}
