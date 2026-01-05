import { TicketVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createTicketType(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInput = parseNumber(formData.get("price"));
  const capacityInput = parseNumber(formData.get("capacity"));
  const visibilityInput = String(formData.get("visibility") ?? "PUBLIC");
  const isComp = formData.get("isComp") === "on";

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Name is required.");
  }

  if (priceInput === null || priceInput < 0) {
    throw new Error("Price must be a valid number.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const visibility =
    visibilityInput === TicketVisibility.PRIVATE
      ? TicketVisibility.PRIVATE
      : TicketVisibility.PUBLIC;

  const price = Math.round(priceInput * 100);
  const capacity =
    capacityInput !== null && capacityInput > 0 ? capacityInput : null;

  const ticketType = await prisma.ticketType.create({
    data: {
      orgId: campaign.orgId,
      campaignId,
      name,
      description: description || null,
      price,
      capacity,
      visibility,
      isComp,
    },
  });

  return ticketType.id;
}
