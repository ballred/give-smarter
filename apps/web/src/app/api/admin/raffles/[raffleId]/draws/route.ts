import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { raffleId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raffle = await prisma.raffle.findUnique({
    where: { id: params.raffleId },
    select: { orgId: true },
  });

  if (!raffle) {
    return NextResponse.json({ error: "raffle_not_found" }, { status: 404 });
  }

  const tickets = await prisma.raffleTicket.findMany({
    where: { raffleId: params.raffleId },
  });

  const drawnAt = new Date();

  if (!tickets.length) {
    const draw = await prisma.raffleDraw.create({
      data: {
        orgId: raffle.orgId,
        raffleId: params.raffleId,
        drawnAt,
        notes: "No tickets sold",
      },
    });

    return NextResponse.json({ data: draw }, { status: 201 });
  }

  const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];

  const draw = await prisma.raffleDraw.create({
    data: {
      orgId: raffle.orgId,
      raffleId: params.raffleId,
      drawnAt,
      winnerDonorId: winnerTicket.donorId ?? null,
    },
  });

  return NextResponse.json({ data: draw }, { status: 201 });
}
