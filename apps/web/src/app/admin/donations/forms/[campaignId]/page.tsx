import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateDonationConfig } from "../donation-actions";

type DonationTier = {
  amount: number;
  label?: string;
  description?: string;
};

function formatTierLines(tiers: DonationTier[]) {
  if (!tiers.length) {
    return "50|Classroom supplies\n100|Field trip support\n250|STEM lab refresh";
  }

  return tiers
    .map((tier) => {
      const amount = (tier.amount / 100).toFixed(2);
      const label = tier.label ?? "";
      const description = tier.description ?? "";
      const parts = [amount, label, description].filter(Boolean);
      return parts.join("|");
    })
    .join("\n");
}

function parseDesignations(config: unknown) {
  if (!config || typeof config !== "object") return [];
  const record = config as Record<string, unknown>;
  if (!Array.isArray(record.designationOptions)) return [];
  return record.designationOptions
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export default async function DonationFormDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      organization: { select: { publicName: true } },
      modules: { where: { type: "DONATIONS" } },
    },
  });

  if (!campaign) {
    notFound();
  }

  const module = campaign.modules[0];
  const config = module?.config as Record<string, unknown> | undefined;
  const tiers = Array.isArray(config?.tiers)
    ? (config?.tiers as DonationTier[])
    : [];
  const allowCustomAmount = config?.allowCustomAmount === true;
  const coverFeesEnabled = config?.coverFeesEnabled === true;
  const coverFeesDefault = config?.coverFeesDefault === true;
  const designationOptions = parseDesignations(config).join("\n");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {campaign.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Donation form · {campaign.name}
        </h1>
        <p className="text-sm text-zinc-600">
          Configure the donation experience for this campaign.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateDonationConfig(campaign.id, formData);
          redirect(`/admin/donations/forms/${campaign.id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Donation tiers (amount|label|description per line)
          <textarea
            name="tiers"
            rows={6}
            defaultValue={formatTierLines(tiers)}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="allowCustomAmount"
              defaultChecked={allowCustomAmount}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              Allow custom amount entry
              <span className="mt-1 block text-xs text-zinc-500">
                Enables donors to enter any amount.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="coverFeesEnabled"
              defaultChecked={coverFeesEnabled}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>
              Offer fee coverage
              <span className="mt-1 block text-xs text-zinc-500">
                Adds a donor option to cover processing costs.
              </span>
            </span>
          </label>
        </div>

        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="coverFeesDefault"
            defaultChecked={coverFeesDefault}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900"
          />
          <span>
            Default fee coverage checked
            <span className="mt-1 block text-xs text-zinc-500">
              Recommended only if your team wants opt-out coverage.
            </span>
          </span>
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Designation options (one per line)
          <textarea
            name="designations"
            rows={4}
            defaultValue={designationOptions}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="General Fund\nSTEM\nArts"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save donation form
        </button>
      </form>
    </div>
  );
}
