import { prisma } from "@/lib/db";

const FUNDRAISER_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type FundraiserStatus = (typeof FUNDRAISER_STATUSES)[number];

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

function parseStatus(value: FormDataEntryValue | null): FundraiserStatus {
  const input = String(value ?? "PUBLISHED").toUpperCase();
  if (FUNDRAISER_STATUSES.includes(input as FundraiserStatus)) {
    return input as FundraiserStatus;
  }
  return "PUBLISHED";
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

async function validateTeam(teamId: string, campaignId: string) {
  const team = await prisma.peerFundraisingTeam.findUnique({
    where: { id: teamId },
    select: { campaignId: true },
  });

  if (!team) {
    throw new Error("Team not found.");
  }

  if (team.campaignId !== campaignId) {
    throw new Error("Team does not belong to this campaign.");
  }
}

async function validateClassroom(classroomId: string, campaignId: string) {
  const classroom = await prisma.peerFundraisingClassroom.findUnique({
    where: { id: classroomId },
    select: { campaignId: true },
  });

  if (!classroom) {
    throw new Error("Classroom not found.");
  }

  if (classroom.campaignId !== campaignId) {
    throw new Error("Classroom does not belong to this campaign.");
  }
}

export async function createPeerFundraiser(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const goalAmount = parseNumber(formData.get("goalAmount"));
  const status = parseStatus(formData.get("status"));
  const teamId = String(formData.get("teamId") ?? "").trim();
  const classroomId = String(formData.get("classroomId") ?? "").trim();

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

  if (teamId) {
    await validateTeam(teamId, campaignId);
  }

  if (classroomId) {
    await validateClassroom(classroomId, campaignId);
  }

  const fundraiser = await prisma.peerFundraiser.create({
    data: {
      orgId,
      campaignId,
      name,
      slug,
      story: story || null,
      goalAmount: goalAmount ?? null,
      status,
      teamId: teamId || null,
      classroomId: classroomId || null,
    },
  });

  return fundraiser.id;
}

export async function updatePeerFundraiser(
  fundraiserId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const goalAmount = parseNumber(formData.get("goalAmount"));
  const status = parseStatus(formData.get("status"));
  const teamId = String(formData.get("teamId") ?? "").trim();
  const classroomId = String(formData.get("classroomId") ?? "").trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  const slug = normalizeSlug(rawSlug || name);

  if (!slug) {
    throw new Error("Slug is required.");
  }

  const existing = await prisma.peerFundraiser.findUnique({
    where: { id: fundraiserId },
    select: { campaignId: true },
  });

  if (!existing) {
    throw new Error("Fundraiser not found.");
  }

  if (teamId) {
    await validateTeam(teamId, existing.campaignId);
  }

  if (classroomId) {
    await validateClassroom(classroomId, existing.campaignId);
  }

  await prisma.peerFundraiser.update({
    where: { id: fundraiserId },
    data: {
      name,
      slug,
      story: story || null,
      goalAmount: goalAmount ?? null,
      status,
      teamId: teamId || null,
      classroomId: classroomId || null,
    },
  });
}
