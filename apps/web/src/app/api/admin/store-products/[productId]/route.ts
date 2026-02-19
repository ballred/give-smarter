import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { StoreProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

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
  { params }: { params: Promise<{ productId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  let body: StoreProductUpdatePayload;

  try {
    body = (await request.json()) as StoreProductUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeProduct = await prisma.storeProduct.findUnique({
    where: { id: productId },
  });

  if (!beforeProduct) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
    where: { id: productId },
    data,
  });

  await logAuditEntry({
    orgId: product.orgId,
    action: "store_product.update",
    targetType: "StoreProduct",
    targetId: productId,
    beforeData: beforeProduct,
    afterData: product,
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.storeProduct.delete({ where: { id: productId } });

  await logAuditEntry({
    orgId: product.orgId,
    action: "store_product.delete",
    targetType: "StoreProduct",
    targetId: productId,
    beforeData: product,
  });

  return NextResponse.json({ ok: true });
}
