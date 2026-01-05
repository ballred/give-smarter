import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type VariantUpdatePayload = {
  name?: string;
  sku?: string | null;
  price?: number;
  priceCents?: number;
  inventoryCount?: number | null;
};

export async function GET(
  _request: Request,
  { params }: { params: { productId: string; variantId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const variant = await prisma.storeVariant.findFirst({
    where: { id: params.variantId, productId: params.productId },
  });

  if (!variant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: variant });
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string; variantId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: VariantUpdatePayload;

  try {
    body = (await request.json()) as VariantUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.sku !== undefined) data.sku = body.sku;
  if (body.inventoryCount !== undefined) {
    data.inventoryCount = body.inventoryCount;
  }

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

  const variant = await prisma.storeVariant.update({
    where: { id: params.variantId },
    data,
  });

  return NextResponse.json({ data: variant });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string; variantId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await prisma.storeVariant.delete({
    where: { id: params.variantId },
  });

  return NextResponse.json({ ok: true });
}
