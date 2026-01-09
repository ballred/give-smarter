import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type AuctionCategoryUpdatePayload = {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  parentId?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auctionId: string; categoryId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { auctionId, categoryId } = await params;

  const category = await prisma.auctionCategory.findFirst({
    where: { id: categoryId, auctionId },
  });

  if (!category) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: category });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ auctionId: string; categoryId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { categoryId } = await params;

  let body: AuctionCategoryUpdatePayload;

  try {
    body = (await request.json()) as AuctionCategoryUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.parentId !== undefined) data.parentId = body.parentId;

  const category = await prisma.auctionCategory.update({
    where: { id: categoryId },
    data,
  });

  return NextResponse.json({ data: category });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ auctionId: string; categoryId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { categoryId } = await params;

  await prisma.auctionCategory.delete({
    where: { id: categoryId },
  });

  return NextResponse.json({ ok: true });
}
