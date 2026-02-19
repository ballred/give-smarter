import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50/40 font-sans">
      {/* Subtle warm radial glow behind the card */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(251,247,242,0.9),transparent)]" />

      <main className="relative flex w-full max-w-2xl flex-col gap-12 px-8 py-20 text-center sm:px-10">
        {/* Logo mark */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 shadow-[0_8px_30px_rgba(15,118,110,0.2)]">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-campaign-display)" }}>G</span>
        </div>

        <header className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700/80">
            GiveSmarter
          </p>
          <h1
            className="text-4xl font-semibold leading-[1.15] text-stone-900 sm:text-5xl"
            style={{ fontFamily: "var(--font-campaign-display)" }}
          >
            Fundraising made simple for school communities.
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-stone-500">
            Campaigns, auctions, tickets, and donor outreach — everything your
            PTA needs in one place.
          </p>
        </header>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-teal-700 px-8 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(15,118,110,0.25)] transition hover:bg-teal-800 hover:shadow-[0_4px_24px_rgba(15,118,110,0.35)]"
            href="/sign-in"
          >
            Sign in to get started
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-amber-200 bg-white px-8 text-sm font-semibold text-stone-600 transition hover:border-amber-300 hover:text-stone-900"
            href="/admin"
          >
            Go to admin
          </Link>
        </div>

        <p className="text-xs text-stone-400">
          Built for PTAs, school fundraisers, and community campaigns.
        </p>
      </main>
    </div>
  );
}
