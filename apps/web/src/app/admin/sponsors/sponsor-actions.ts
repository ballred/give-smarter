import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

export async function createSponsor(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      orgId,
      name,
      level: level || null,
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
    },
  });

  return sponsor.id;
}

export async function updateSponsor(sponsorId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  await prisma.sponsor.update({
    where: { id: sponsorId },
    data: {
      name,
      level: level || null,
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
    },
  });
}

export async function addSponsorPlacement(
  sponsorId: string,
  formData: FormData,
) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const placementType = String(formData.get("placementType") ?? "").trim();
  const placementRefId = String(formData.get("placementRefId") ?? "").trim();
  const sortOrderInput = parseNumber(formData.get("sortOrder"));

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!placementType) {
    throw new Error("Placement type is required.");
  }

  if (!placementRefId) {
    throw new Error("Placement reference is required.");
  }

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    select: { orgId: true },
  });

  if (!sponsor) {
    throw new Error("Sponsor not found.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign || campaign.orgId !== sponsor.orgId) {
    throw new Error("Campaign does not belong to this organization.");
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      orgId: sponsor.orgId,
      sponsorId,
      campaignId,
      placementType,
      placementRefId,
      sortOrder: sortOrderInput ?? 0,
    },
  });

  return placement.id;
}
