import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AuctionItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type AuctionItemUpdatePayload = {
  title?: string;
  description?: string | null;
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
  { params }: { params: { auctionId: string; itemId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const item = await prisma.auctionItem.findFirst({
    where: { id: params.itemId, auctionId: params.auctionId },
  });

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}

export async function PATCH(
  request: Request,
  { params }: { params: { auctionId: string; itemId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AuctionItemUpdatePayload;

  try {
    body = (await request.json()) as AuctionItemUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.startingBid !== undefined || body.startingBidCents !== undefined) {
    const cents =
      typeof body.startingBidCents === "number"
        ? body.startingBidCents
        : typeof body.startingBid === "number"
          ? Math.round(body.startingBid * 100)
          : null;
    if (cents === null || cents < 0) {
      return NextResponse.json({ error: "invalid_starting_bid" }, { status: 400 });
    }
    data.startingBid = cents;
  }

  if (body.buyNowPrice !== undefined || body.buyNowPriceCents !== undefined) {
    const cents =
      typeof body.buyNowPriceCents === "number"
        ? body.buyNowPriceCents
        : typeof body.buyNowPrice === "number"
          ? Math.round(body.buyNowPrice * 100)
          : null;
    data.buyNowPrice = cents ?? null;
  }

  if (body.quantity !== undefined) {
    data.quantity = body.quantity > 0 ? body.quantity : 1;
  }

  if (body.fmvAmount !== undefined || body.fmvAmountCents !== undefined) {
    const cents =
      typeof body.fmvAmountCents === "number"
        ? body.fmvAmountCents
        : typeof body.fmvAmount === "number"
          ? Math.round(body.fmvAmount * 100)
          : 0;
    data.fmvAmount = cents > 0 ? cents : 0;
  }

  if (body.status !== undefined) data.status = body.status;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.isPreviewOnly !== undefined) data.isPreviewOnly = body.isPreviewOnly;
  if (body.fulfillmentMethod !== undefined) {
    data.fulfillmentMethod = body.fulfillmentMethod;
  }

  const item = await prisma.auctionItem.update({
    where: { id: params.itemId },
    data,
  });

  return NextResponse.json({ data: item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { auctionId: string; itemId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.auctionItem.delete({
    where: { id: params.itemId },
  });

  return NextResponse.json({ ok: true });
}
