import { headers } from "next/headers";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  type LineItemType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";
import { createOrderNumber, normalizeLineItems } from "@/lib/orders";
import { getStripeClient } from "@/lib/stripe";

async function resolveOrigin() {
  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return null;
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function closeAuctionItem(itemId: string) {
  const item = await prisma.auctionItem.findUnique({
    where: { id: itemId },
    include: {
      auction: {
        include: {
          campaign: {
            select: {
              id: true,
              slug: true,
              orgId: true,
              organization: { select: { defaultCurrency: true } },
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new Error("Auction item not found.");
  }

  if (item.status === "CLOSED") {
    return;
  }

  const previousStatus = item.status;

  const topBid = await prisma.bid.findFirst({
    where: { auctionItemId: item.id },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
  });

  if (!topBid) {
    throw new Error("No bids to close.");
  }

  const donor = await prisma.donor.findUnique({
    where: { id: topBid.donorId },
    select: { id: true, primaryEmail: true, primaryPhone: true },
  });

  if (!donor) {
    throw new Error("Winning bidder not found.");
  }

  const currency =
    item.auction.campaign.organization.defaultCurrency ?? "USD";
  const amount = topBid.amount;
  const benefitAmount = item.fmvAmount;
  const taxDeductibleAmount = Math.max(0, amount - benefitAmount);

  const normalized = normalizeLineItems(
    [
      {
        type: "AUCTION_WIN" as LineItemType,
        sourceId: item.id,
        description: item.title,
        quantity: 1,
        unitAmount: amount,
        totalAmount: amount,
        fmvAmount: item.fmvAmount,
        benefitAmount,
        taxDeductibleAmount,
      },
    ],
    currency,
  );

  const order = await prisma.order.create({
    data: {
      orgId: item.orgId,
      campaignId: item.auction.campaign.id,
      donorId: donor.id,
      orderNumber: createOrderNumber(),
      status: OrderStatus.PENDING,
      totalAmount: normalized.totalAmount,
      currency,
      coverFeesAmount: 0,
      lineItems: {
        create: normalized.items.map((lineItem) => ({
          organization: { connect: { id: item.orgId } },
          type: lineItem.type,
          sourceId: lineItem.sourceId,
          description: lineItem.description,
          quantity: lineItem.quantity,
          unitAmount: lineItem.unitAmount,
          totalAmount: lineItem.totalAmount,
          currency: lineItem.currency,
          fmvAmount: lineItem.fmvAmount,
          benefitAmount: lineItem.benefitAmount,
          taxDeductibleAmount: lineItem.taxDeductibleAmount,
          metadata: lineItem.metadata as object | undefined,
        })),
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orgId: item.orgId,
      orderId: order.id,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.REQUIRES_PAYMENT,
      amount: normalized.totalAmount,
      currency,
      netAmount: normalized.totalAmount,
    },
  });

  await prisma.auctionItem.update({
    where: { id: item.id },
    data: { status: "CLOSED", closesAt: new Date() },
  });

  await logAuditEntry({
    orgId: item.orgId,
    action: "auction_item.closed",
    targetType: "auction_item",
    targetId: item.id,
    beforeData: { status: previousStatus },
    afterData: { status: "CLOSED", orderId: order.id },
  });

  const origin = await resolveOrigin();
  if (!origin) {
    throw new Error("Missing request origin.");
  }

  const successUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${item.auction.campaign.slug}/auction/${item.id}?canceled=1`;

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "pay",
    customer_email: donor.primaryEmail ?? undefined,
    line_items: normalized.items.map((lineItem) => ({
      price_data: {
        currency: lineItem.currency.toLowerCase(),
        product_data: {
          name: lineItem.description ?? "Auction item",
        },
        unit_amount: lineItem.unitAmount,
      },
      quantity: lineItem.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    payment_intent_data: {
      metadata: {
        orgId: item.orgId,
        orderId: order.id,
        paymentId: payment.id,
        campaignId: item.auction.campaign.id,
        auctionItemId: item.id,
        ...(donor.id ? { donorId: donor.id } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  const body = `Your auction invoice is ready: ${session.url}`;

  if (donor.primaryPhone) {
    await prisma.messageSend.create({
      data: {
        orgId: item.orgId,
        channel: "SMS",
        to: donor.primaryPhone,
        body,
        status: "QUEUED",
      },
    });
  } else if (donor.primaryEmail) {
    await prisma.messageSend.create({
      data: {
        orgId: item.orgId,
        channel: "EMAIL",
        to: donor.primaryEmail,
        subject: `Invoice for ${item.title}`,
        body,
        status: "QUEUED",
      },
    });
  }
}
