import { prisma } from "@/lib/db";

export async function assignTable(formData: FormData) {
  const attendeeId = String(formData.get("attendeeId") ?? "").trim();
  const tableIdInput = String(formData.get("tableId") ?? "").trim();
  const tableId = tableIdInput || null;

  if (!attendeeId) {
    throw new Error("Attendee is required.");
  }

  const attendee = await prisma.attendee.findUnique({
    where: { id: attendeeId },
    select: { id: true, campaignId: true, tableId: true },
  });

  if (!attendee) {
    throw new Error("Attendee not found.");
  }

  if (tableId) {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { campaignId: true },
    });

    if (!table || table.campaignId !== attendee.campaignId) {
      throw new Error("Table does not match attendee campaign.");
    }
  }

  await prisma.attendee.update({
    where: { id: attendee.id },
    data:
      tableId && tableId !== attendee.tableId
        ? { tableId, seatId: null }
        : { tableId },
  });
}
