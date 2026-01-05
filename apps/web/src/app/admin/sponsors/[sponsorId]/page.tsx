import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { addSponsorPlacement, updateSponsor } from "../sponsor-actions";

type SponsorDetailPageProps = {
  params: { sponsorId: string };
};

export default async function SponsorDetailPage({
  params,
}: SponsorDetailPageProps) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: params.sponsorId },
    include: {
      organization: { select: { publicName: true } },
      placements: {
        include: { campaign: { select: { name: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!sponsor) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Sponsor not found.
      </div>
    );
  }

  const campaigns = await prisma.campaign.findMany({
    where: { orgId: sponsor.orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{sponsor.name}</h1>
        <p className="text-sm text-zinc-600">
          {sponsor.organization.publicName} | Sponsor profile
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateSponsor(params.sponsorId, formData);
          redirect(`/admin/sponsors/${params.sponsorId}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Sponsor name
          <input
            name="name"
            type="text"
            required
            defaultValue={sponsor.name}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Sponsor level
          <input
            name="level"
            type="text"
            defaultValue={sponsor.level ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Logo URL
          <input
            name="logoUrl"
            type="url"
            defaultValue={sponsor.logoUrl ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Website URL
          <input
            name="websiteUrl"
            type="url"
            defaultValue={sponsor.websiteUrl ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save changes
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          Sponsor placements
        </h2>
        <form
          className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-2"
          action={async (formData) => {
            "use server";
            await addSponsorPlacement(params.sponsorId, formData);
            redirect(`/admin/sponsors/${params.sponsorId}`);
          }}
        >
          <label className="block text-sm font-semibold text-zinc-700">
            Campaign
            <select
              name="campaignId"
              required
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="" disabled>
                Select a campaign
              </option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-zinc-700">
            Placement type
            <select
              name="placementType"
              required
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="CAMPAIGN_PAGE">Campaign page</option>
              <option value="MODULE">Module</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-zinc-700">
            Placement reference
            <input
              name="placementRefId"
              type="text"
              placeholder="Page slug or module key"
              required
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>

          <label className="block text-sm font-semibold text-zinc-700">
            Sort order
            <input
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
            >
              Add placement
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Campaign
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Reference
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700">
                  Sort
                </th>
              </tr>
            </thead>
            <tbody>
              {sponsor.placements.length ? (
                sponsor.placements.map((placement) => (
                  <tr key={placement.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-600">
                      {placement.campaign?.name ?? "Campaign"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {placement.placementType}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {placement.placementRefId}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {placement.sortOrder}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-zinc-500"
                    colSpan={4}
                  >
                    No placements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
