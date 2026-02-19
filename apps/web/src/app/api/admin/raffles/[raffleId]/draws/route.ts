import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ raffleId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { raffleId } = await params;

  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { orgId: true },
  });

  if (!raffle) {
    return NextResponse.json({ error: "raffle_not_found" }, { status: 404 });
  }

  const tickets = await prisma.raffleTicket.findMany({
    where: { raffleId },
  });

  const drawnAt = new Date();

  if (!tickets.length) {
    const draw = await prisma.raffleDraw.create({
      data: {
        orgId: raffle.orgId,
        raffleId,
        drawnAt,
        notes: "No tickets sold",
      },
    });

    await logAuditEntry({
      orgId: raffle.orgId,
      action: "raffle_draw.create",
      targetType: "RaffleDraw",
      targetId: draw.id,
      afterData: draw,
    });

    return NextResponse.json({ data: draw }, { status: 201 });
  }

  const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];

  const draw = await prisma.raffleDraw.create({
    data: {
      orgId: raffle.orgId,
      raffleId,
      drawnAt,
      winnerDonorId: winnerTicket.donorId ?? null,
    },
  });

  await logAuditEntry({
    orgId: raffle.orgId,
    action: "raffle_draw.create",
    targetType: "RaffleDraw",
    targetId: draw.id,
    afterData: draw,
  });

  return NextResponse.json({ data: draw }, { status: 201 });
}
