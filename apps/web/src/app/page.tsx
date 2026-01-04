import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex w-full max-w-3xl flex-col gap-10 rounded-3xl border border-zinc-200 bg-white px-10 py-14 shadow-sm">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            GiveSmarter
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900">
            Fundraising infrastructure for modern school campaigns.
          </h1>
          <p className="text-lg leading-8 text-zinc-600">
            This workspace is live. Admins can sign in to start configuring
            campaigns, auctions, tickets, and donor outreach.
          </p>
        </header>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
            href="/sign-in"
          >
            Admin sign in
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300"
            href="/admin"
          >
            Go to admin
          </Link>
        </div>
      </main>
    </div>
  );
}
