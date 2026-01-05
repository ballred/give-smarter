import { prisma } from "@/lib/db";
import { defaultBidIncrementRules } from "@give-smarter/core";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createAuction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const opensAtRaw = String(formData.get("opensAt") ?? "");
  const closesAtRaw = String(formData.get("closesAt") ?? "");
  const allowMaxBid = formData.get("allowMaxBid") === "on";
  const allowBuyNow = formData.get("allowBuyNow") === "on";
  const antiSnipingMinutes = parseNumber(formData.get("antiSnipingMinutes"));

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!timezone) {
    throw new Error("Timezone is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const opensAt = opensAtRaw ? new Date(opensAtRaw) : null;
  const closesAt = closesAtRaw ? new Date(closesAtRaw) : null;

  const auction = await prisma.auction.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      name,
      timezone,
      opensAt,
      closesAt,
      allowMaxBid,
      allowBuyNow,
      antiSnipingMinutes:
        antiSnipingMinutes !== null && antiSnipingMinutes > 0
          ? antiSnipingMinutes
          : null,
      bidIncrementRules: defaultBidIncrementRules,
    },
  });

  return auction.id;
}
