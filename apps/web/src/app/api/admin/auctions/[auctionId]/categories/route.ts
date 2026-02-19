import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type AuctionCategoryPayload = {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  parentId?: string | null;
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

  const categories = await prisma.auctionCategory.findMany({
    where: { auctionId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: categories });
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

  let body: AuctionCategoryPayload;

  try {
    body = (await request.json()) as AuctionCategoryPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { orgId: true },
  });

  if (!auction) {
    return NextResponse.json({ error: "auction_not_found" }, { status: 404 });
  }

  const category = await prisma.auctionCategory.create({
    data: {
      orgId: auction.orgId,
      auctionId,
      name: body.name,
      description: body.description ?? null,
      sortOrder: body.sortOrder ?? 0,
      parentId: body.parentId ?? null,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
