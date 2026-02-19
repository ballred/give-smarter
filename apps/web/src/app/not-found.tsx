import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--gs-surface)] px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_38%,rgba(251,247,242,0.9),transparent)]" />

      <div className="relative max-w-xl space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700/80">
          GiveSmarter
        </p>
        <h1
          className="text-6xl font-semibold text-stone-900 sm:text-7xl"
          style={{ fontFamily: "var(--font-campaign-display)" }}
        >
          404
        </h1>
        <p className="text-lg text-stone-600">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-teal-700 px-7 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(15,118,110,0.25)] transition hover:bg-teal-800 hover:shadow-[0_4px_24px_rgba(15,118,110,0.35)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
