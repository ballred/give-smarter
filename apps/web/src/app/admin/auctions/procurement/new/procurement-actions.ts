import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createProcurementSubmission(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const donorName = String(formData.get("donorName") ?? "").trim();
  const donorEmail = String(formData.get("donorEmail") ?? "").trim();
  const donorPhone = String(formData.get("donorPhone") ?? "").trim();
  const itemTitle = String(formData.get("itemTitle") ?? "").trim();
  const itemDescription = String(formData.get("itemDescription") ?? "").trim();
  const restrictions = String(formData.get("restrictions") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const fmvInput = parseNumber(formData.get("fmvAmount"));

  if (!donorName) {
    throw new Error("Donor name is required.");
  }

  const orgSource = campaignId
    ? await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { orgId: true },
      })
    : await prisma.organization.findFirst({ select: { id: true } });

  if (!orgSource) {
    throw new Error("Organization not found.");
  }

  const orgId = "orgId" in orgSource ? orgSource.orgId : orgSource.id;

  const donor = await prisma.procurementDonor.create({
    data: {
      orgId,
      name: donorName,
      email: donorEmail || null,
      phone: donorPhone || null,
    },
  });

  const submission = await prisma.procurementSubmission.create({
    data: {
      orgId,
      campaignId: campaignId || null,
      procurementDonorId: donor.id,
      itemTitle: itemTitle || null,
      itemDescription: itemDescription || null,
      fmvAmount:
        fmvInput !== null && fmvInput > 0 ? Math.round(fmvInput * 100) : null,
      restrictions: restrictions || null,
      notes: notes || null,
    },
  });

  return submission.id;
}
