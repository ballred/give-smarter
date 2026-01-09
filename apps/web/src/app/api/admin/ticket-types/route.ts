import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TicketVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type TicketTypePayload = {
  campaignId?: string;
  name?: string;
  description?: string;
  price?: number;
  priceCents?: number;
  capacity?: number | null;
  visibility?: TicketVisibility;
  isComp?: boolean;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ticketTypes = await prisma.ticketType.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: ticketTypes });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: TicketTypePayload;

  try {
    body = (await request.json()) as TicketTypePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const priceCents =
    typeof body.priceCents === "number"
      ? body.priceCents
      : typeof body.price === "number"
        ? Math.round(body.price * 100)
        : null;

  if (priceCents === null || !Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const ticketType = await prisma.ticketType.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      description: body.description ?? null,
      price: Math.round(priceCents),
      capacity: body.capacity ?? null,
      visibility: body.visibility ?? TicketVisibility.PUBLIC,
      isComp: body.isComp ?? false,
    },
  });

  return NextResponse.json({ data: ticketType }, { status: 201 });
}
