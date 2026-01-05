import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StoreProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type StoreProductUpdatePayload = {
  name?: string;
  description?: string | null;
  price?: number;
  priceCents?: number;
  sku?: string | null;
  inventoryCount?: number | null;
  shippingRequired?: boolean;
  status?: StoreProductStatus;
};

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: params.productId },
  });

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: StoreProductUpdatePayload;

  try {
    body = (await request.json()) as StoreProductUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.sku !== undefined) data.sku = body.sku;
  if (body.inventoryCount !== undefined) {
    data.inventoryCount = body.inventoryCount;
  }
  if (body.shippingRequired !== undefined) {
    data.shippingRequired = body.shippingRequired;
  }
  if (body.status !== undefined) data.status = body.status;

  if (body.price !== undefined || body.priceCents !== undefined) {
    const cents =
      typeof body.priceCents === "number"
        ? body.priceCents
        : typeof body.price === "number"
          ? Math.round(body.price * 100)
          : null;
    if (cents === null || cents < 0) {
      return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    }
    data.price = cents;
  }

  const product = await prisma.storeProduct.update({
    where: { id: params.productId },
    data,
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.storeProduct.delete({ where: { id: params.productId } });

  return NextResponse.json({ ok: true });
}
