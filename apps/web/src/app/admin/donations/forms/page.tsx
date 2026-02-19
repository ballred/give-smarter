import Link from "next/link";
import { prisma } from "@/lib/db";

function summarizeConfig(config: unknown) {
  if (!config || typeof config !== "object") {
    return { tiers: 0, custom: false, coverFees: false };
  }

  const record = config as Record<string, unknown>;
  const tiers = Array.isArray(record.tiers) ? record.tiers.length : 0;
  const custom = record.allowCustomAmount === true;
  const coverFees = record.coverFeesEnabled === true;

  return { tiers, custom, coverFees };
}

export default async function DonationFormsPage() {
  const modules = await prisma.campaignModule.findMany({
    where: { type: "DONATIONS" },
    include: {
      campaign: { select: { id: true, name: true, status: true } },
      organization: { select: { publicName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Donation forms</h1>
        <p className="text-sm text-stone-600">
          Configure donation tiers, designations, and fee coverage.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Tiers</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Options</th>
            </tr>
          </thead>
          <tbody>
            {modules.length ? (
              modules.map((module) => {
                const summary = summarizeConfig(module.config);
                return (
                  <tr key={module.id} className="border-b border-amber-100">
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      <Link
                        className="text-stone-900 hover:text-stone-700"
                        href={`/admin/donations/forms/${module.campaignId}`}
                      >
                        {module.campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {module.organization.publicName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {module.campaign.status}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {summary.tiers}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {summary.custom ? "Custom amount" : ""}
                      {summary.custom && summary.coverFees ? " · " : ""}
                      {summary.coverFees ? "Cover fees" : ""}
                      {!summary.custom && !summary.coverFees ? "—" : ""}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500" colSpan={5}>
                  No donation modules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
