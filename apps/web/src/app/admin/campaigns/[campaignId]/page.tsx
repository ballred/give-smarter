import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { campaignFormOptions, updateCampaign } from "../campaign-actions";

function formatModuleLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      organization: { select: { publicName: true } },
      modules: { select: { type: true, isEnabled: true } },
    },
  });

  if (!campaign) {
    notFound();
  }

  const moduleSet = new Set(
    campaign.modules.filter((module) => module.isEnabled).map((module) => module.type),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {campaign.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {campaign.name}
        </h1>
        <p className="text-sm text-zinc-600">Slug: {campaign.slug}</p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateCampaign(campaign.id, formData);
          redirect(`/admin/campaigns/${campaign.id}`);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Campaign name
            <input
              name="name"
              type="text"
              required
              defaultValue={campaign.name}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Slug
            <input
              name="slug"
              type="text"
              defaultValue={campaign.slug}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Type
            <select
              name="type"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              defaultValue={campaign.type}
            >
              {campaignFormOptions.campaignTypes.map((type) => (
                <option key={type} value={type}>
                  {formatModuleLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Status
            <select
              name="status"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              defaultValue={campaign.status}
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
          <label className="block text-sm font-semibold text-zinc-700">
            Starts at
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(campaign.startsAt)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Ends at
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(campaign.endsAt)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Goal amount (USD)
          <input
            name="goalAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={campaign.goalAmount ? campaign.goalAmount / 100 : ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={campaign.description ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Hero title
            <input
              name="heroTitle"
              type="text"
              defaultValue={campaign.heroTitle ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Hero media URL
            <input
              name="heroMediaUrl"
              type="url"
              defaultValue={campaign.heroMediaUrl ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-zinc-700">
          Story content
          <textarea
            name="storyContent"
            rows={4}
            defaultValue={campaign.storyContent ?? ""}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            SEO title
            <input
              name="seoTitle"
              type="text"
              defaultValue={campaign.seoTitle ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            SEO description
            <input
              name="seoDescription"
              type="text"
              defaultValue={campaign.seoDescription ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-700">
            Modules
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            {campaignFormOptions.moduleTypes.map((module) => (
              <label key={module} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="modules"
                  value={module}
                  defaultChecked={moduleSet.has(module)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-zinc-700">{formatModuleLabel(module)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update campaign
        </button>
      </form>
    </div>
  );
}
