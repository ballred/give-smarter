import { prisma } from "@/lib/db";

const MODULE_TYPES = [
  "DONATIONS",
  "TICKETING",
  "AUCTION",
  "PADDLE_RAISE",
  "RAFFLE",
  "VOTING",
  "STORE",
  "PEER_TO_PEER",
  "LIVESTREAM",
  "VOLUNTEER",
] as const;

const CAMPAIGN_TYPES = [
  "EVENT",
  "ONLINE",
  "HYBRID",
  "PEER_TO_PEER",
  "AUCTION_ONLY",
] as const;

const CAMPAIGN_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type ModuleType = (typeof MODULE_TYPES)[number];

type CampaignType = (typeof CAMPAIGN_TYPES)[number];

type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCampaignType(value: string): CampaignType {
  if (CAMPAIGN_TYPES.includes(value as CampaignType)) {
    return value as CampaignType;
  }
  return "EVENT";
}

function parseCampaignStatus(value: string): CampaignStatus {
  if (CAMPAIGN_STATUSES.includes(value as CampaignStatus)) {
    return value as CampaignStatus;
  }
  return "DRAFT";
}

function parseModules(values: FormDataEntryValue[]) {
  const modules = values
    .map((value) => String(value))
    .filter((value): value is ModuleType =>
      MODULE_TYPES.includes(value as ModuleType),
    );
  return Array.from(new Set(modules));
}

export async function createCampaign(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const heroTitle = String(formData.get("heroTitle") ?? "").trim();
  const heroMediaUrl = String(formData.get("heroMediaUrl") ?? "").trim();
  const storyContent = String(formData.get("storyContent") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const type = parseCampaignType(String(formData.get("type") ?? "EVENT"));
  const status = parseCampaignStatus(
    String(formData.get("status") ?? "DRAFT"),
  );
  const startsAt = parseDate(formData.get("startsAt"));
  const endsAt = parseDate(formData.get("endsAt"));
  const goalInput = parseNumber(formData.get("goalAmount"));
  const modules = parseModules(formData.getAll("modules"));

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  const slug = normalizeSlug(rawSlug || name);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId,
      name,
      slug,
      description: description || null,
      type,
      status,
      startsAt,
      endsAt,
      goalAmount: goalInput && goalInput > 0 ? Math.round(goalInput * 100) : null,
      heroTitle: heroTitle || null,
      heroMediaUrl: heroMediaUrl || null,
      storyContent: storyContent || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    },
  });

  if (modules.length) {
    await prisma.campaignModule.createMany({
      data: modules.map((module) => ({
        orgId,
        campaignId: campaign.id,
        type: module,
        isEnabled: true,
      })),
      skipDuplicates: true,
    });
  }

  return campaign.id;
}

export async function updateCampaign(
  campaignId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const heroTitle = String(formData.get("heroTitle") ?? "").trim();
  const heroMediaUrl = String(formData.get("heroMediaUrl") ?? "").trim();
  const storyContent = String(formData.get("storyContent") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const type = parseCampaignType(String(formData.get("type") ?? "EVENT"));
  const status = parseCampaignStatus(
    String(formData.get("status") ?? "DRAFT"),
  );
  const startsAt = parseDate(formData.get("startsAt"));
  const endsAt = parseDate(formData.get("endsAt"));
  const goalInput = parseNumber(formData.get("goalAmount"));
  const modules = parseModules(formData.getAll("modules"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const slug = normalizeSlug(rawSlug || name);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      name,
      slug,
      description: description || null,
      type,
      status,
      startsAt,
      endsAt,
      goalAmount: goalInput && goalInput > 0 ? Math.round(goalInput * 100) : null,
      heroTitle: heroTitle || null,
      heroMediaUrl: heroMediaUrl || null,
      storyContent: storyContent || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    },
  });

  const existingModules = await prisma.campaignModule.findMany({
    where: { campaignId },
    select: { id: true, type: true },
  });

  const existingTypes = new Set(existingModules.map((module) => module.type));
  const desiredTypes = new Set(modules);

  const toCreate = modules.filter((module) => !existingTypes.has(module));
  const toDelete = existingModules
    .filter((module) => !desiredTypes.has(module.type))
    .map((module) => module.id);

  if (toCreate.length) {
    await prisma.campaignModule.createMany({
      data: toCreate.map((module) => ({
        orgId: campaign.orgId,
        campaignId,
        type: module,
        isEnabled: true,
      })),
      skipDuplicates: true,
    });
  }

  if (toDelete.length) {
    await prisma.campaignModule.deleteMany({
      where: { id: { in: toDelete } },
    });
  }
}

export const campaignFormOptions = {
  moduleTypes: MODULE_TYPES,
  campaignTypes: CAMPAIGN_TYPES,
  campaignStatuses: CAMPAIGN_STATUSES,
};
