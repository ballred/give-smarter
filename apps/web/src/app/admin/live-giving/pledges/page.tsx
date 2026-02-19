import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createPaddleRaisePledge } from "./pledge-actions";

export default async function PaddleRaisePledgesPage() {
  const [campaigns, levels, pledges] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.paddleRaiseLevel.findMany({
      include: { campaign: { select: { name: true } } },
      orderBy: [{ campaignId: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.paddleRaisePledge.findMany({
      include: {
        donor: { select: { displayName: true, primaryEmail: true } },
        campaign: { select: { name: true } },
        level: { select: { label: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Paddle raise pledges
        </h1>
        <p className="text-sm text-stone-600">
          Enter pledges quickly and keep the live display updated.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await createPaddleRaisePledge(formData);
          redirect("/admin/live-giving/pledges");
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Campaign
          <select
            name="campaignId"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Paddle raise level (optional)
            <select
              name="levelId"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="">Custom amount</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.campaign?.name ?? "Campaign"} - {level.label} (
                  {(level.amount / 100).toFixed(0)})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Custom amount (USD)
            <input
              name="customAmount"
              type="number"
              min="1"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Paddle number
            <input
              name="paddleNumber"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>

          <label className="block text-sm font-semibold text-stone-700">
            Donor email (optional)
            <input
              name="email"
              type="email"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            First name
            <input
              name="firstName"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Last name
            <input
              name="lastName"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Add pledge
        </button>
      </form>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Donor</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Level</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Amount</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Paddle</th>
            </tr>
          </thead>
          <tbody>
            {pledges.length ? (
              pledges.map((pledge) => (
                <tr key={pledge.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 text-stone-600">
                    {pledge.donor?.displayName ??
                      pledge.donor?.primaryEmail ??
                      "Guest"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {pledge.campaign?.name ?? "Campaign"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {pledge.level?.label ?? "Custom"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {(pledge.amount / 100).toFixed(2)} USD
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {pledge.paddleNumber ?? "--"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={5}
                >
                  No pledges yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
