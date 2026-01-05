import { prisma } from "@/lib/db";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function createTable(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const capacityInput = parseNumber(formData.get("capacity"));
  const generateSeats = formData.get("generateSeats") === "on";

  if (!campaignId) {
    throw new Error("Campaign is required.");
  }

  if (!name) {
    throw new Error("Table name is required.");
  }

  if (capacityInput === null || capacityInput <= 0) {
    throw new Error("Capacity must be a positive number.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const capacity = Math.round(capacityInput);

  const tableId = await prisma.$transaction(async (tx) => {
    const table = await tx.table.create({
      data: {
        orgId: campaign.orgId,
        campaignId,
        name,
        capacity,
        notes: notes || null,
      },
    });

    if (generateSeats) {
      await tx.seat.createMany({
        data: Array.from({ length: capacity }, (_, index) => ({
          orgId: campaign.orgId,
          tableId: table.id,
          seatNumber: index + 1,
        })),
      });
    }

    return table.id;
  });

  return tableId;
}
