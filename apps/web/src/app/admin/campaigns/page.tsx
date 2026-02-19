import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      organization: { select: { publicName: true } },
      modules: { select: { type: true, isEnabled: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Campaigns</h1>
          <p className="text-sm text-stone-600">
            Manage campaign settings, modules, and publishing status.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href="/admin/campaigns/new"
        >
          New campaign
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Type</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Modules</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Slug</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      className="text-stone-900 hover:text-stone-700"
                      href={`/admin/campaigns/${campaign.id}`}
                    >
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {campaign.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{campaign.type}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {campaign.status}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {campaign.modules.filter((module) => module.isEnabled).length}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{campaign.slug}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500" colSpan={6}>
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
