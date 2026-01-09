import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attendeeId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { attendeeId } = await params;

  const existing = await prisma.checkin.findFirst({
    where: { attendeeId },
  });

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  const attendee = await prisma.attendee.findUnique({
    where: { id: attendeeId },
    select: { orgId: true },
  });

  if (!attendee) {
    return NextResponse.json({ error: "attendee_not_found" }, { status: 404 });
  }

  const checkin = await prisma.checkin.create({
    data: {
      orgId: attendee.orgId,
      attendeeId,
      method: "SEARCH",
      checkedInAt: new Date(),
    },
  });

  return NextResponse.json({ data: checkin });
}
