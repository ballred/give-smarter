import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type VolunteerShiftUpdate = {
  name?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { shiftId } = await params;

  const shift = await prisma.volunteerShift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: shift });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { shiftId } = await params;

  let body: VolunteerShiftUpdate;

  try {
    body = (await request.json()) as VolunteerShiftUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeShift = await prisma.volunteerShift.findUnique({
    where: { id: shiftId },
  });

  if (!beforeShift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const shift = await prisma.volunteerShift.update({
    where: { id: shiftId },
    data: {
      name: body.name,
      description: body.description ?? undefined,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      capacity: body.capacity ?? undefined,
    },
  });

  await logAuditEntry({
    orgId: shift.orgId,
    action: "volunteer_shift.update",
    targetType: "VolunteerShift",
    targetId: shiftId,
    beforeData: beforeShift,
    afterData: shift,
  });

  return NextResponse.json({ data: shift });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { shiftId } = await params;

  const shift = await prisma.volunteerShift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.volunteerShift.delete({
    where: { id: shiftId },
  });

  await logAuditEntry({
    orgId: shift.orgId,
    action: "volunteer_shift.delete",
    targetType: "VolunteerShift",
    targetId: shiftId,
    beforeData: shift,
  });

  return NextResponse.json({ ok: true });
}
