import { prisma } from "@/lib/db";

type DonationTier = {
  amount: number;
  label?: string;
  description?: string;
};

function parseNumber(value: string) {
  const cleaned = value.replace(/[$,]/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseTierLine(line: string): DonationTier | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.includes("|")
    ? trimmed.split("|")
    : trimmed.split(",");
  const amountPart = parts.shift();
  if (!amountPart) return null;

  const amountValue = parseNumber(amountPart);
  if (!amountValue || amountValue <= 0) return null;

  const label = parts.shift()?.trim();
  const description = parts.join(" ").trim();

  return {
    amount: Math.round(amountValue * 100),
    label: label || undefined,
    description: description || undefined,
  };
}

function parseDesignations(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function updateDonationConfig(
  campaignId: string,
  formData: FormData,
) {
  const tiersText = String(formData.get("tiers") ?? "");
  const designationText = String(formData.get("designations") ?? "");
  const allowCustomAmount = formData.get("allowCustomAmount") === "on";
  const coverFeesEnabled = formData.get("coverFeesEnabled") === "on";
  const coverFeesDefault = formData.get("coverFeesDefault") === "on";

  const tiers = tiersText
    .split("\n")
    .map(parseTierLine)
    .filter(Boolean) as DonationTier[];

  const designationOptions = parseDesignations(designationText);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const config = {
    tiers,
    allowCustomAmount,
    coverFeesEnabled,
    coverFeesDefault,
    designationOptions,
  };

  await prisma.campaignModule.upsert({
    where: {
      campaignId_type: {
        campaignId,
        type: "DONATIONS",
      },
    },
    create: {
      orgId: campaign.orgId,
      campaignId,
      type: "DONATIONS",
      isEnabled: true,
      config,
    },
    update: {
      config,
      isEnabled: true,
    },
  });
}
