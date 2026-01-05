import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSponsor } from "../sponsor-actions";

export default async function NewSponsorPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, publicName: true },
  });

  if (!organizations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Create an organization before adding sponsors.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Create sponsor
        </h1>
        <p className="text-sm text-zinc-600">
          Add sponsor details and branding assets.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createSponsor(formData);
          redirect(`/admin/sponsors/${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Organization
          <select
            name="orgId"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="" disabled>
              Select an organization
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.publicName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Sponsor name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Sponsor level
          <input
            name="level"
            type="text"
            placeholder="Gold, Silver, Platinum"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Logo URL
          <input
            name="logoUrl"
            type="url"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Website URL
          <input
            name="websiteUrl"
            type="url"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Create sponsor
        </button>
      </form>
    </div>
  );
}
