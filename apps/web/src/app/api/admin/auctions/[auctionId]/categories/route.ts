import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
  { params }: { params: { auctionId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const categories = await prisma.auctionCategory.findMany({
    where: { auctionId: params.auctionId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(
  request: Request,
  { params }: { params: { auctionId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
    where: { id: params.auctionId },
    select: { orgId: true },
  });

  if (!auction) {
    return NextResponse.json({ error: "auction_not_found" }, { status: 404 });
  }

  const category = await prisma.auctionCategory.create({
    data: {
      orgId: auction.orgId,
      auctionId: params.auctionId,
      name: body.name,
      description: body.description ?? null,
      sortOrder: body.sortOrder ?? 0,
      parentId: body.parentId ?? null,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
