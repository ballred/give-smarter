import { NextResponse } from "next/server";
import {
  LineItemType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createOrderNumber,
  mapSourceToLineItemType,
  normalizeLineItems,
  type OrderLineItemInput,
} from "@/lib/orders";
import { getStripeClient } from "@/lib/stripe";

type PaymentIntentRequest = {
  orgId?: string;
  campaignId?: string;
  donorId?: string;
  amount?: number;
  currency?: string;
  receiptEmail?: string;
  source?: "donation" | "ticket" | "auction";
  sourceId?: string;
  coverFeesAmount?: number;
  lineItems?: OrderLineItemInput[];
  metadata?: Record<string, unknown>;
};

export const runtime = "nodejs";

const LINE_ITEM_TYPES = new Set(Object.values(LineItemType));

function isLineItemType(value: unknown): value is LineItemType {
  return typeof value === "string" && LINE_ITEM_TYPES.has(value as LineItemType);
}

function normalizeMetadata(input?: Record<string, unknown>) {
  const metadata: Record<string, string> = {};

  if (!input) {
    return metadata;
  }

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }

    metadata[key] = String(value);
  }

  return metadata;
}

export async function POST(request: Request) {
  let body: PaymentIntentRequest;

  try {
    body = (await request.json()) as PaymentIntentRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || !body.orgId || typeof body.orgId !== "string") {
    return NextResponse.json({ error: "missing_org_id" }, { status: 400 });
  }

  const orgId = body.orgId;
  const currency = (body.currency ?? "USD").toUpperCase();
  const coverFeesAmount = Math.round(body.coverFeesAmount ?? 0);

  if (coverFeesAmount < 0) {
    return NextResponse.json({ error: "invalid_cover_fees_amount" }, { status: 400 });
  }

  const lineItemsInput: OrderLineItemInput[] = [];

  if (Array.isArray(body.lineItems) && body.lineItems.length > 0) {
    for (const rawItem of body.lineItems) {
      if (!rawItem || typeof rawItem !== "object") {
        return NextResponse.json({ error: "invalid_line_items" }, { status: 400 });
      }

      const item = rawItem as OrderLineItemInput;

      if (!isLineItemType(item.type)) {
        return NextResponse.json({ error: "invalid_line_item_type" }, { status: 400 });
      }

      if (
        typeof item.unitAmount !== "number" ||
        !Number.isFinite(item.unitAmount) ||
        item.unitAmount <= 0
      ) {
        return NextResponse.json({ error: "invalid_line_item_amount" }, { status: 400 });
      }

      lineItemsInput.push(item);
    }
  } else {
    if (
      typeof body.amount !== "number" ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    lineItemsInput.push({
      type: mapSourceToLineItemType(body.source ?? "donation"),
      sourceId: body.sourceId,
      unitAmount: body.amount,
      totalAmount: body.amount,
    });
  }

  if (coverFeesAmount > 0) {
    lineItemsInput.push({
      type: "FEE_COVERAGE_DONATION",
      description: "Fee coverage",
      unitAmount: coverFeesAmount,
      totalAmount: coverFeesAmount,
    });
  }

  const normalized = normalizeLineItems(lineItemsInput, currency);

  if (normalized.totalAmount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orgId,
      campaignId: body.campaignId,
      donorId: body.donorId,
      orderNumber: createOrderNumber(),
      status: OrderStatus.PENDING,
      totalAmount: normalized.totalAmount,
      currency,
      coverFeesAmount,
      lineItems: {
        create: normalized.items.map((item) => ({
          orgId,
          type: item.type,
          sourceId: item.sourceId,
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          totalAmount: item.totalAmount,
          currency: item.currency,
          fmvAmount: item.fmvAmount,
          benefitAmount: item.benefitAmount,
          taxDeductibleAmount: item.taxDeductibleAmount,
          metadata: item.metadata,
        })),
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orgId,
      orderId: order.id,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.REQUIRES_PAYMENT,
      amount: normalized.totalAmount,
      currency,
      netAmount: normalized.totalAmount,
    },
  });

  const metadata: Record<string, string> = {
    orgId,
    orderId: order.id,
    paymentId: payment.id,
    source: body.source ?? "donation",
    ...(body.sourceId ? { sourceId: body.sourceId } : {}),
    ...(body.campaignId ? { campaignId: body.campaignId } : {}),
    ...(body.donorId ? { donorId: body.donorId } : {}),
    ...normalizeMetadata(body.metadata),
  };

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: normalized.totalAmount,
      currency: currency.toLowerCase(),
      receipt_email: body.receiptEmail,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentId: payment.id,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELED },
    });

    const message = error instanceof Error ? error.message : "stripe_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
