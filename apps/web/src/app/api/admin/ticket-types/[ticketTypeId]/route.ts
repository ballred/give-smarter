import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TicketVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type TicketTypeUpdatePayload = {
  name?: string;
  description?: string | null;
  price?: number;
  capacity?: number | null;
  visibility?: TicketVisibility;
  isComp?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: { ticketTypeId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: params.ticketTypeId },
  });

  if (!ticketType) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: ticketType });
}

export async function PATCH(
  request: Request,
  { params }: { params: { ticketTypeId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: TicketTypeUpdatePayload;

  try {
    body = (await request.json()) as TicketTypeUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    data.name = body.name;
  }

  if (body.description !== undefined) {
    data.description = body.description;
  }

  if (body.price !== undefined) {
    if (!Number.isFinite(body.price) || body.price < 0) {
      return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    }
    data.price = Math.round(body.price * 100);
  }

  if (body.capacity !== undefined) {
    data.capacity =
      body.capacity === null || body.capacity > 0 ? body.capacity : null;
  }

  if (body.visibility !== undefined) {
    data.visibility = body.visibility;
  }

  if (body.isComp !== undefined) {
    data.isComp = body.isComp;
  }

  const ticketType = await prisma.ticketType.update({
    where: { id: params.ticketTypeId },
    data,
  });

  return NextResponse.json({ data: ticketType });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { ticketTypeId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.ticketType.delete({
    where: { id: params.ticketTypeId },
  });

  return NextResponse.json({ ok: true });
}
