import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseBundleRules(input: string): object | undefined {
  if (!input) return undefined;

  try {
    return JSON.parse(input) as object;
  } catch {
    return { note: input };
  }
}

export async function createRaffle(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const ticketPriceInput = parseNumber(formData.get("ticketPrice"));
  const maxTicketsInput = parseNumber(formData.get("maxTicketsPerPerson"));
  const bundleRulesInput = String(formData.get("bundleRules") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const rulesUrl = String(formData.get("rulesUrl") ?? "").trim();

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (ticketPriceInput === null || ticketPriceInput < 0) {
    throw new Error("Ticket price must be valid.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const raffle = await prisma.raffle.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      name,
      ticketPrice: Math.round(ticketPriceInput * 100),
      bundleRules: parseBundleRules(bundleRulesInput),
      maxTicketsPerPerson:
        maxTicketsInput !== null && maxTicketsInput > 0
          ? maxTicketsInput
          : null,
      startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      rulesUrl: rulesUrl || null,
    },
  });

  return raffle.id;
}
