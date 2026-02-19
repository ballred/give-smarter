import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

function parseAmount(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 100) : null;
}

async function resolveDonor({
  orgId,
  email,
  firstName,
  lastName,
}: {
  orgId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (!email) return null;

  const existing = await prisma.donor.findFirst({
    where: { orgId, primaryEmail: email },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  const donor = await prisma.donor.create({
    data: {
      orgId,
      primaryEmail: email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
    },
  });

  return donor.id;
}

export async function createPaddleRaisePledge(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const levelId = String(formData.get("levelId") ?? "").trim();
  const customAmount = parseAmount(formData.get("customAmount"));
  const paddleNumber = String(formData.get("paddleNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  let amount: number | null = null;
  let resolvedLevelId: string | null = null;

  if (levelId) {
    const level = await prisma.paddleRaiseLevel.findUnique({
      where: { id: levelId },
      select: { campaignId: true, amount: true },
    });

    if (!level) {
      throw new Error("Level not found.");
    }

    if (level.campaignId !== campaignId) {
      throw new Error("Level does not belong to this campaign.");
    }

    amount = level.amount;
    resolvedLevelId = levelId;
  } else if (customAmount && customAmount > 0) {
    amount = customAmount;
  }

  if (!amount || amount <= 0) {
    throw new Error("Amount is required.");
  }

  const donorId = await resolveDonor({
    orgId: campaign.orgId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  const { userId } = await auth();
  const enteredBy = userId
    ? await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
      })
    : null;

  const pledge = await prisma.paddleRaisePledge.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      donorId,
      levelId: resolvedLevelId,
      amount,
      paddleNumber: paddleNumber || null,
      enteredByUserId: enteredBy?.id ?? null,
    },
  });

  return pledge.id;
}
