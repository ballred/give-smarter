import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";
import { defaultBidIncrementRules } from "@give-smarter/core";

export const runtime = "nodejs";

type AuctionPayload = {
  campaignId?: string;
  name?: string;
  timezone?: string;
  opensAt?: string;
  closesAt?: string;
  allowMaxBid?: boolean;
  allowBuyNow?: boolean;
  antiSnipingMinutes?: number | null;
  bidIncrementRules?: unknown;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const auctions = await prisma.auction.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: auctions });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AuctionPayload;

  try {
    body = (await request.json()) as AuctionPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name || !body.timezone) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const opensAt = body.opensAt ? new Date(body.opensAt) : null;
  const closesAt = body.closesAt ? new Date(body.closesAt) : null;

  if (opensAt && Number.isNaN(opensAt.getTime())) {
    return NextResponse.json({ error: "invalid_opens_at" }, { status: 400 });
  }

  if (closesAt && Number.isNaN(closesAt.getTime())) {
    return NextResponse.json({ error: "invalid_closes_at" }, { status: 400 });
  }

  const auction = await prisma.auction.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      timezone: body.timezone,
      opensAt,
      closesAt,
      allowMaxBid: body.allowMaxBid ?? true,
      allowBuyNow: body.allowBuyNow ?? false,
      antiSnipingMinutes:
        body.antiSnipingMinutes !== undefined &&
        body.antiSnipingMinutes !== null &&
        body.antiSnipingMinutes > 0
          ? body.antiSnipingMinutes
          : null,
      bidIncrementRules: body.bidIncrementRules ?? defaultBidIncrementRules,
    },
  });

  await logAuditEntry({
    orgId: campaign.orgId,
    action: "auction.create",
    targetType: "Auction",
    targetId: auction.id,
    afterData: auction,
  });

  return NextResponse.json({ data: auction }, { status: 201 });
}
