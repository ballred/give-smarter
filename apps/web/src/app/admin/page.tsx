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
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-zinc-900">
          Admin dashboard
        </h1>
        <p className="text-zinc-600">
          Set up campaigns, configure modules, and monitor fundraising
          performance.
        </p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Get started</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Create your first campaign and enable the modules you need for the
            event.
          </p>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
            href="/admin/campaigns"
          >
            Go to campaigns
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Preview</h2>
          <p className="mt-2 text-sm text-zinc-600">
            View a live campaign page once your data is loaded into the system.
          </p>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300"
            href={previewHref}
          >
            {previewCampaign ? "View sample" : "Create campaign"}
          </Link>
        </div>
      </section>
    </div>
  );
}
