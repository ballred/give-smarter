import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createKeywordRoute } from "../keyword-actions";

export default async function NewKeywordRoutePage() {
  const [organizations, campaigns] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, publicName: true },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!organizations.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900">
          New keyword route
        </h1>
        <p className="text-sm text-zinc-600">
          Create an organization before adding keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          New keyword route
        </h1>
        <p className="text-sm text-zinc-600">
          Configure an SMS keyword to send donors to the right campaign.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createKeywordRoute(formData);
          redirect(`/admin/donations/keywords/${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Organization
          <select
            name="orgId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            required
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.publicName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Keyword
          <input
            name="keyword"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="GIVE"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Campaign (optional)
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Auto-reply message
          <textarea
            name="replyMessage"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="Thanks for supporting our campaign! Donate here: {{link}}"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Status
          <select
            name="status"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            defaultValue="ACTIVE"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save keyword
        </button>
      </form>
    </div>
  );
}
