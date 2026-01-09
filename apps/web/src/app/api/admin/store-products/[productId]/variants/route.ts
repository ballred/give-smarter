import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type VariantPayload = {
  name?: string;
  sku?: string | null;
  price?: number;
  priceCents?: number;
  inventoryCount?: number | null;
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

  const variants = await prisma.storeVariant.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: variants });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  let body: VariantPayload;

  try {
    body = (await request.json()) as VariantPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
    select: { orgId: true },
  });

  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  const priceCents =
    typeof body.priceCents === "number"
      ? body.priceCents
      : typeof body.price === "number"
        ? Math.round(body.price * 100)
        : null;

  const variant = await prisma.storeVariant.create({
    data: {
      orgId: product.orgId,
      productId,
      name: body.name,
      sku: body.sku ?? null,
      price: priceCents !== null && priceCents > 0 ? priceCents : null,
      inventoryCount: body.inventoryCount ?? null,
    },
  });

  await logAuditEntry({
    orgId: product.orgId,
    action: "store_variant.create",
    targetType: "StoreVariant",
    targetId: variant.id,
    afterData: variant,
  });

  return NextResponse.json({ data: variant }, { status: 201 });
}
