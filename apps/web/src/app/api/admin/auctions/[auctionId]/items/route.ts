import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AuctionItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type AuctionItemPayload = {
  title?: string;
  description?: string;
  categoryId?: string | null;
  startingBid?: number;
  startingBidCents?: number;
  buyNowPrice?: number | null;
  buyNowPriceCents?: number | null;
  quantity?: number;
  fmvAmount?: number;
  fmvAmountCents?: number;
  status?: AuctionItemStatus;
  isFeatured?: boolean;
  isPreviewOnly?: boolean;
  fulfillmentMethod?: string | null;
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

  const items = await prisma.auctionItem.findMany({
    where: { auctionId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { auctionId } = await params;

  let body: AuctionItemPayload;

  try {
    body = (await request.json()) as AuctionItemPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  }

  const startingBidCents =
    typeof body.startingBidCents === "number"
      ? body.startingBidCents
      : typeof body.startingBid === "number"
        ? Math.round(body.startingBid * 100)
        : null;

  if (startingBidCents === null || startingBidCents < 0) {
    return NextResponse.json({ error: "invalid_starting_bid" }, { status: 400 });
  }

  const buyNowCents =
    typeof body.buyNowPriceCents === "number"
      ? body.buyNowPriceCents
      : typeof body.buyNowPrice === "number"
        ? Math.round(body.buyNowPrice * 100)
        : null;

  const fmvCents =
    typeof body.fmvAmountCents === "number"
      ? body.fmvAmountCents
      : typeof body.fmvAmount === "number"
        ? Math.round(body.fmvAmount * 100)
        : 0;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { orgId: true },
  });

  if (!auction) {
    return NextResponse.json({ error: "auction_not_found" }, { status: 404 });
  }

  const item = await prisma.auctionItem.create({
    data: {
      orgId: auction.orgId,
      auctionId,
      title: body.title,
      description: body.description ?? null,
      categoryId: body.categoryId ?? null,
      startingBid: startingBidCents,
      buyNowPrice: buyNowCents ?? null,
      quantity: body.quantity && body.quantity > 0 ? body.quantity : 1,
      fmvAmount: fmvCents > 0 ? fmvCents : 0,
      status: body.status ?? AuctionItemStatus.DRAFT,
      isFeatured: body.isFeatured ?? false,
      isPreviewOnly: body.isPreviewOnly ?? false,
      fulfillmentMethod: body.fulfillmentMethod ?? null,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
