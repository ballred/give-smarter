import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type AuctionUpdatePayload = {
  name?: string;
  timezone?: string;
  opensAt?: string | null;
  closesAt?: string | null;
  allowMaxBid?: boolean;
  allowBuyNow?: boolean;
  antiSnipingMinutes?: number | null;
  bidIncrementRules?: unknown;
  status?: "DRAFT" | "LIVE" | "CLOSED";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { auctionId } = await params;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: auction });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { auctionId } = await params;

  let body: AuctionUpdatePayload;

  try {
    body = (await request.json()) as AuctionUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.opensAt !== undefined) {
    data.opensAt = body.opensAt ? new Date(body.opensAt) : null;
  }
  if (body.closesAt !== undefined) {
    data.closesAt = body.closesAt ? new Date(body.closesAt) : null;
  }
  if (body.allowMaxBid !== undefined) data.allowMaxBid = body.allowMaxBid;
  if (body.allowBuyNow !== undefined) data.allowBuyNow = body.allowBuyNow;
  if (body.antiSnipingMinutes !== undefined) {
    data.antiSnipingMinutes =
      body.antiSnipingMinutes !== null && body.antiSnipingMinutes > 0
        ? body.antiSnipingMinutes
        : null;
  }
  if (body.bidIncrementRules !== undefined) {
    data.bidIncrementRules = body.bidIncrementRules;
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }

  const auction = await prisma.auction.update({
    where: { id: auctionId },
    data,
  });

  return NextResponse.json({ data: auction });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { auctionId } = await params;

  await prisma.auction.delete({ where: { id: auctionId } });

  return NextResponse.json({ ok: true });
}
