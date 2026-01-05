import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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
  { params }: { params: { shiftId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shift = await prisma.volunteerShift.findUnique({
    where: { id: params.shiftId },
  });

  if (!shift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: shift });
}

export async function PUT(
  request: Request,
  { params }: { params: { shiftId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: VolunteerShiftUpdate;

  try {
    body = (await request.json()) as VolunteerShiftUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const shift = await prisma.volunteerShift.update({
    where: { id: params.shiftId },
    data: {
      name: body.name,
      description: body.description ?? undefined,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      capacity: body.capacity ?? undefined,
    },
  });

  return NextResponse.json({ data: shift });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { shiftId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.volunteerShift.delete({
    where: { id: params.shiftId },
  });

  return NextResponse.json({ ok: true });
}
