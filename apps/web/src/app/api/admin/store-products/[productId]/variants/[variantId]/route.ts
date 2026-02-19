import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

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
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { productId, variantId } = await params;

  const variant = await prisma.storeVariant.findFirst({
    where: { id: variantId, productId },
  });

  if (!variant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: variant });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { variantId } = await params;

  let body: VariantUpdatePayload;

  try {
    body = (await request.json()) as VariantUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeVariant = await prisma.storeVariant.findUnique({
    where: { id: variantId },
  });

  if (!beforeVariant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
    where: { id: variantId },
    data,
  });

  await logAuditEntry({
    orgId: variant.orgId,
    action: "store_variant.update",
    targetType: "StoreVariant",
    targetId: variantId,
    beforeData: beforeVariant,
    afterData: variant,
  });

  return NextResponse.json({ data: variant });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { variantId } = await params;

  const variant = await prisma.storeVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.storeVariant.delete({
    where: { id: variantId },
  });

  await logAuditEntry({
    orgId: variant.orgId,
    action: "store_variant.delete",
    targetType: "StoreVariant",
    targetId: variantId,
    beforeData: variant,
  });

  return NextResponse.json({ ok: true });
}
