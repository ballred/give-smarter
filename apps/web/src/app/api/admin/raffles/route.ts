import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RafflePayload = {
  campaignId?: string;
  name?: string;
  ticketPrice?: number;
  ticketPriceCents?: number;
  bundleRules?: unknown;
  maxTicketsPerPerson?: number | null;
  startsAt?: string;
  endsAt?: string;
  rulesUrl?: string | null;
};

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raffles = await prisma.raffle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: raffles });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RafflePayload;

  try {
    body = (await request.json()) as RafflePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const ticketPriceCents =
    typeof body.ticketPriceCents === "number"
      ? body.ticketPriceCents
      : typeof body.ticketPrice === "number"
        ? Math.round(body.ticketPrice * 100)
        : null;

  if (ticketPriceCents === null || ticketPriceCents < 0) {
    return NextResponse.json({ error: "invalid_ticket_price" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const raffle = await prisma.raffle.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      ticketPrice: ticketPriceCents,
      bundleRules: body.bundleRules ?? null,
      maxTicketsPerPerson: body.maxTicketsPerPerson ?? null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      rulesUrl: body.rulesUrl ?? null,
    },
  });

  return NextResponse.json({ data: raffle }, { status: 201 });
}
