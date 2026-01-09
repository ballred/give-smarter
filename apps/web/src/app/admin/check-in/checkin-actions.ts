import { prisma } from "@/lib/db";

export async function checkInAttendee(
  attendeeId: string,
  method: "SEARCH" | "QR" = "SEARCH",
) {
  const existing = await prisma.checkin.findFirst({
    where: { attendeeId },
  });

  if (existing) {
    return existing;
  }

  return prisma.checkin.create({
    data: {
      orgId: await resolveOrgId(attendeeId),
      attendeeId,
      method,
      checkedInAt: new Date(),
    },
  });
}

export async function bulkCheckIn(formData: FormData) {
  const attendeeIds = formData.getAll("attendeeIds").map(String);

  if (!attendeeIds.length) {
    return;
  }

  const existing = await prisma.checkin.findMany({
    where: { attendeeId: { in: attendeeIds } },
    select: { attendeeId: true },
  });

  const existingIds = new Set(existing.map((item) => item.attendeeId));
  const pendingIds = attendeeIds.filter((id) => !existingIds.has(id));

  if (!pendingIds.length) {
    return;
  }

  const attendees = await prisma.attendee.findMany({
    where: { id: { in: pendingIds } },
    select: { id: true, orgId: true },
  });

  if (!attendees.length) {
    return;
  }

  await prisma.checkin.createMany({
    data: attendees.map((attendee) => ({
      orgId: attendee.orgId,
      attendeeId: attendee.id,
      method: "SEARCH",
      checkedInAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

export async function checkInByQr(formData: FormData) {
  const qrCode = String(formData.get("qrCode") ?? "").trim();

  if (!qrCode) {
    throw new Error("QR code is required.");
  }

  const attendee = await prisma.attendee.findFirst({
    where: { qrCode },
    select: { id: true },
  });

  if (!attendee) {
    throw new Error("Attendee not found.");
  }

  await checkInAttendee(attendee.id, "QR");

  return attendee.id;
}

async function resolveOrgId(attendeeId: string) {
  const attendee = await prisma.attendee.findUnique({
    where: { id: attendeeId },
    select: { orgId: true },
  });

  if (!attendee) {
    throw new Error("Attendee not found.");
  }

  return attendee.orgId;
}
