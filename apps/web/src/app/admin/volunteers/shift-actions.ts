import { prisma } from "@/lib/db";

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : null;
}

export async function createVolunteerShift(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = parseDate(formData.get("startsAt"));
  const endsAt = parseDate(formData.get("endsAt"));
  const capacity = parseNumber(formData.get("capacity"));

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Shift name is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const shift = await prisma.volunteerShift.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      name,
      description: description || null,
      startsAt,
      endsAt,
      capacity: capacity ?? null,
    },
  });

  return shift.id;
}

export async function updateVolunteerShift(
  shiftId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = parseDate(formData.get("startsAt"));
  const endsAt = parseDate(formData.get("endsAt"));
  const capacity = parseNumber(formData.get("capacity"));

  if (!name) {
    throw new Error("Shift name is required.");
  }

  await prisma.volunteerShift.update({
    where: { id: shiftId },
    data: {
      name,
      description: description || null,
      startsAt,
      endsAt,
      capacity: capacity ?? null,
    },
  });
}
