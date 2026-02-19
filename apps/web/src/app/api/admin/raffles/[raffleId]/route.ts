import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type RaffleUpdatePayload = {
  name?: string;
  ticketPrice?: number;
  ticketPriceCents?: number;
  bundleRules?: unknown;
  maxTicketsPerPerson?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  rulesUrl?: string | null;
  status?: "DRAFT" | "ACTIVE" | "CLOSED";
};

export async function GET(
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
  });

  if (!raffle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: raffle });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ raffleId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { raffleId } = await params;

  let body: RaffleUpdatePayload;

  try {
    body = (await request.json()) as RaffleUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeRaffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
  });

  if (!beforeRaffle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.bundleRules !== undefined) data.bundleRules = body.bundleRules;
  if (body.maxTicketsPerPerson !== undefined) {
    data.maxTicketsPerPerson = body.maxTicketsPerPerson;
  }
  if (body.startsAt !== undefined) {
    data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  }
  if (body.endsAt !== undefined) {
    data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  }
  if (body.rulesUrl !== undefined) data.rulesUrl = body.rulesUrl;
  if (body.status !== undefined) data.status = body.status;

  if (body.ticketPrice !== undefined || body.ticketPriceCents !== undefined) {
    const cents =
      typeof body.ticketPriceCents === "number"
        ? body.ticketPriceCents
        : typeof body.ticketPrice === "number"
          ? Math.round(body.ticketPrice * 100)
          : null;
    if (cents === null || cents < 0) {
      return NextResponse.json({ error: "invalid_ticket_price" }, { status: 400 });
    }
    data.ticketPrice = cents;
  }

  const raffle = await prisma.raffle.update({
    where: { id: raffleId },
    data,
  });

  await logAuditEntry({
    orgId: raffle.orgId,
    action: "raffle.update",
    targetType: "Raffle",
    targetId: raffleId,
    beforeData: beforeRaffle,
    afterData: raffle,
  });

  return NextResponse.json({ data: raffle });
}

export async function DELETE(
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
  });

  if (!raffle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.raffle.delete({ where: { id: raffleId } });

  await logAuditEntry({
    orgId: raffle.orgId,
    action: "raffle.delete",
    targetType: "Raffle",
    targetId: raffleId,
    beforeData: raffle,
  });

  return NextResponse.json({ ok: true });
}
