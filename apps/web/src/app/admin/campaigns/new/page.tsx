import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { campaignFormOptions, createCampaign } from "../campaign-actions";

function formatModuleLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function NewCampaignPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, publicName: true },
  });

  if (!organizations.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">New campaign</h1>
        <p className="text-sm text-stone-600">
          Create an organization before adding campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">New campaign</h1>
        <p className="text-sm text-stone-600">
          Set up the campaign details and activate modules.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createCampaign(formData);
          redirect(`/admin/campaigns/${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Organization
          <select
            name="orgId"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            required
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.publicName}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Campaign name
            <input
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Slug
            <input
              name="slug"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="spring-gala"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Type
            <select
              name="type"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              defaultValue="EVENT"
            >
              {campaignFormOptions.campaignTypes.map((type) => (
                <option key={type} value={type}>
                  {formatModuleLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Status
            <select
              name="status"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              defaultValue="DRAFT"
            >
              {campaignFormOptions.campaignStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatModuleLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Starts at
            <input
              name="startsAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Ends at
            <input
              name="endsAt"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Goal amount (USD)
          <input
            name="goalAmount"
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Description
          <textarea
            name="description"
            rows={3}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Hero title
            <input
              name="heroTitle"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Hero media URL
            <input
              name="heroMediaUrl"
              type="url"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Story content
          <textarea
            name="storyContent"
            rows={4}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            SEO title
            <input
              name="seoTitle"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            SEO description
            <input
              name="seoDescription"
              type="text"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-stone-700">
            Modules
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            {campaignFormOptions.moduleTypes.map((module) => (
              <label key={module} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="modules"
                  value={module}
                  className="h-4 w-4 rounded border-amber-300 text-teal-600"
                />
                <span className="text-stone-700">{formatModuleLabel(module)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save campaign
        </button>
      </form>
    </div>
  );
}
