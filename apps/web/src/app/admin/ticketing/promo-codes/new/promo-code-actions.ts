import { PromoCodeType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

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

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function createPromoCode(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const codeInput = normalizeCode(String(formData.get("code") ?? ""));
  const discountTypeInput = String(formData.get("discountType") ?? "AMOUNT");
  const amountInput = parseNumber(formData.get("amount"));
  const maxRedemptionsInput = parseNumber(formData.get("maxRedemptions"));
  const startsAt = parseDate(formData.get("startsAt"));
  const endsAt = parseDate(formData.get("endsAt"));
  const isActive = formData.get("isActive") === "on";

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!codeInput) {
    throw new Error("Code is required.");
  }

  if (amountInput === null || amountInput <= 0) {
    throw new Error("Discount amount must be a positive number.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const discountType =
    discountTypeInput === PromoCodeType.PERCENT
      ? PromoCodeType.PERCENT
      : PromoCodeType.AMOUNT;

  const amount =
    discountType === PromoCodeType.PERCENT
      ? Math.round(amountInput)
      : Math.round(amountInput * 100);

  if (discountType === PromoCodeType.PERCENT && amount > 100) {
    throw new Error("Percent discounts cannot exceed 100%.");
  }

  const maxRedemptions =
    maxRedemptionsInput !== null && maxRedemptionsInput > 0
      ? Math.round(maxRedemptionsInput)
      : null;

  const promo = await prisma.promoCode.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      code: codeInput,
      discountType,
      amount,
      maxRedemptions,
      startsAt,
      endsAt,
      isActive,
    },
  });

  await logAuditEntry({
    orgId: campaign.orgId,
    action: "promo_code.created",
    targetType: "promo_code",
    targetId: promo.id,
    afterData: {
      code: promo.code,
      discountType: promo.discountType,
      amount: promo.amount,
      maxRedemptions: promo.maxRedemptions,
      startsAt: promo.startsAt,
      endsAt: promo.endsAt,
      isActive: promo.isActive,
    },
  });

  return promo.id;
}
