import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const previewCampaign = await prisma.campaign.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });

  const previewHref = previewCampaign
    ? `/campaigns/${previewCampaign.slug}`
    : "/admin/campaigns";

  return (
    <div className="space-y-10">
      {/* Welcome header with warm personality */}
      <header className="space-y-2">
        <h1
          className="text-3xl font-semibold text-stone-900"
          style={{ fontFamily: "var(--font-campaign-display)" }}
        >
          Welcome back
        </h1>
        <p className="max-w-lg text-stone-500">
          Set up campaigns, configure modules, and keep your fundraiser
          running smoothly.
        </p>
      </header>

      {/* Quick-action cards */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Get started card — featured with teal accent */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200/60 bg-white p-7 shadow-sm transition hover:shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-50/80" />
          <div className="relative space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/10">
              <span className="text-lg text-teal-700">✦</span>
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              Get started
            </h2>
            <p className="text-sm leading-relaxed text-stone-500">
              Create your first campaign and enable the modules you need for
              the event.
            </p>
            <Link
              className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_2px_12px_rgba(15,118,110,0.2)] transition hover:bg-teal-800"
              href="/admin/campaigns"
            >
              Go to campaigns
            </Link>
          </div>
        </div>

        {/* Preview card */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200/60 bg-white p-7 shadow-sm transition hover:shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50" />
          <div className="relative space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <span className="text-lg text-amber-700">◎</span>
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Preview</h2>
            <p className="text-sm leading-relaxed text-stone-500">
              View a live campaign page once your data is loaded into the
              system.
            </p>
            <Link
              className="mt-1 inline-flex h-10 items-center justify-center rounded-full border border-amber-200/60 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-amber-300"
              href={previewHref}
            >
              {previewCampaign ? "View sample" : "Create campaign"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
