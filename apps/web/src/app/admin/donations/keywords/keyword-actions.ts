import { prisma } from "@/lib/db";

const ROUTE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

type KeywordRouteStatus = (typeof ROUTE_STATUSES)[number];

function normalizeKeyword(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function parseStatus(value: FormDataEntryValue | null): KeywordRouteStatus {
  const input = String(value ?? "ACTIVE").toUpperCase();
  if (ROUTE_STATUSES.includes(input as KeywordRouteStatus)) {
    return input as KeywordRouteStatus;
  }
  return "ACTIVE";
}

export async function createKeywordRoute(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const keywordInput = String(formData.get("keyword") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const replyMessage = String(formData.get("replyMessage") ?? "").trim();
  const status = parseStatus(formData.get("status"));

  const keyword = normalizeKeyword(keywordInput);

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!keyword) {
    throw new Error("Keyword is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  let resolvedCampaignId: string | null = null;

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { orgId: true },
    });

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    if (campaign.orgId !== orgId) {
      throw new Error("Campaign does not belong to this org.");
    }

    resolvedCampaignId = campaignId;
  }

  const route = await prisma.keywordRoute.create({
    data: {
      orgId,
      keyword,
      campaignId: resolvedCampaignId,
      replyMessage: replyMessage || null,
      status,
    },
  });

  return route.id;
}

export async function updateKeywordRoute(
  routeId: string,
  formData: FormData,
) {
  const keywordInput = String(formData.get("keyword") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const replyMessage = String(formData.get("replyMessage") ?? "").trim();
  const status = parseStatus(formData.get("status"));

  const keyword = normalizeKeyword(keywordInput);

  if (!keyword) {
    throw new Error("Keyword is required.");
  }

  const existing = await prisma.keywordRoute.findUnique({
    where: { id: routeId },
    select: { orgId: true },
  });

  if (!existing) {
    throw new Error("Keyword route not found.");
  }

  let resolvedCampaignId: string | null = null;

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { orgId: true },
    });

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    if (campaign.orgId !== existing.orgId) {
      throw new Error("Campaign does not belong to this org.");
    }

    resolvedCampaignId = campaignId;
  }

  await prisma.keywordRoute.update({
    where: { id: routeId },
    data: {
      keyword,
      campaignId: resolvedCampaignId,
      replyMessage: replyMessage || null,
      status,
    },
  });
}
