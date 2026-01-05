import { prisma } from "@/lib/db";

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 100) : null;
}

async function resolveCampaignOrg(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  return campaign.orgId;
}

export async function createPeerTeam(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const goalAmount = parseNumber(formData.get("goalAmount"));

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  const slug = normalizeSlug(rawSlug || name);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  const orgId = await resolveCampaignOrg(campaignId);

  const team = await prisma.peerFundraisingTeam.create({
    data: {
      orgId,
      campaignId,
      name,
      slug,
      story: story || null,
      goalAmount: goalAmount ?? null,
    },
  });

  return team.id;
}

export async function updatePeerTeam(teamId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const goalAmount = parseNumber(formData.get("goalAmount"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const slug = normalizeSlug(rawSlug || name);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  await prisma.peerFundraisingTeam.update({
    where: { id: teamId },
    data: {
      name,
      slug,
      story: story || null,
      goalAmount: goalAmount ?? null,
    },
  });
}
