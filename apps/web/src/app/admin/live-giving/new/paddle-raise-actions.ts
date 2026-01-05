import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createPaddleRaiseLevel(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const amountInput = parseNumber(formData.get("amount"));
  const matchSponsorName = String(formData.get("matchSponsorName") ?? "").trim();
  const sortOrderInput = parseNumber(formData.get("sortOrder"));
  const isActive = formData.get("isActive") === "on";

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!label) {
    throw new Error("Label is required.");
  }

  if (amountInput === null || amountInput < 0) {
    throw new Error("Amount must be valid.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const level = await prisma.paddleRaiseLevel.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      label,
      amount: Math.round(amountInput * 100),
      matchSponsorName: matchSponsorName || null,
      sortOrder: sortOrderInput !== null ? sortOrderInput : 0,
      isActive,
    },
  });

  return level.id;
}
