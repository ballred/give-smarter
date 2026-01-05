import { prisma } from "@/lib/db";

export async function checkInAttendee(attendeeId: string) {
  const existing = await prisma.checkin.findFirst({
    where: { attendeeId },
  });

  if (existing) {
    return existing;
  }

  return prisma.checkin.create({
    data: {
      orgId: existing?.orgId ?? (await resolveOrgId(attendeeId)),
      attendeeId,
      method: "SEARCH",
      checkedInAt: new Date(),
    },
  });
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
