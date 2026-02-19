import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { StoreProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type StoreProductPayload = {
  campaignId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  priceCents?: number;
  sku?: string | null;
  inventoryCount?: number | null;
  shippingRequired?: boolean;
  status?: StoreProductStatus;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const products = await prisma.storeProduct.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: products });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: StoreProductPayload;

  try {
    body = (await request.json()) as StoreProductPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const priceCents =
    typeof body.priceCents === "number"
      ? body.priceCents
      : typeof body.price === "number"
        ? Math.round(body.price * 100)
        : null;

  if (priceCents === null || priceCents < 0) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const product = await prisma.storeProduct.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      description: body.description ?? null,
      price: priceCents,
      currency: "USD",
      sku: body.sku ?? null,
      inventoryCount: body.inventoryCount ?? null,
      shippingRequired: body.shippingRequired ?? false,
      status: body.status ?? StoreProductStatus.ACTIVE,
    },
  });

  await logAuditEntry({
    orgId: campaign.orgId,
    action: "store_product.create",
    targetType: "StoreProduct",
    targetId: product.id,
    afterData: product,
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
