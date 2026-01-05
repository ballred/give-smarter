import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  type LineItemType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrderNumber, normalizeLineItems } from "@/lib/orders";
import { getStripeClient } from "@/lib/stripe";

function parseQuantity(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
}

function resolveOrigin() {
  const headerList = headers();
  const host = headerList.get("host");
  if (!host) return null;
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function resolveDonor({
  orgId,
  email,
  firstName,
  lastName,
}: {
  orgId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (!email) return null;

  const existing = await prisma.donor.findFirst({
    where: { orgId, primaryEmail: email },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  const donor = await prisma.donor.create({
    data: {
      orgId,
      primaryEmail: email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
    },
  });

  return donor.id;
}

export async function createTicketCheckout(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const ticketTypeId = String(formData.get("ticketTypeId") ?? "").trim();
  const quantity = parseQuantity(formData.get("quantity")) ?? 1;
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!campaignId || !ticketTypeId) {
    throw new Error("Campaign and ticket type are required.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      slug: true,
      orgId: true,
      organization: { select: { defaultCurrency: true } },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
  });

  if (!ticketType || ticketType.campaignId !== campaign.id) {
    throw new Error("Ticket type not found.");
  }

  const currency = campaign.organization.defaultCurrency ?? ticketType.currency;
  const unitAmount = ticketType.price;
  const totalAmount = unitAmount * quantity;
  const benefitAmount = ticketType.benefitAmount * quantity;
  const taxDeductibleAmount = Math.max(0, totalAmount - benefitAmount);

  const normalized = normalizeLineItems(
    [
      {
        type: "TICKET" as LineItemType,
        sourceId: ticketType.id,
        description: ticketType.name,
        quantity,
        unitAmount,
        totalAmount,
        fmvAmount: ticketType.fmvAmount * quantity,
        benefitAmount,
        taxDeductibleAmount,
      },
    ],
    currency,
  );

  const donorId = await resolveDonor({
    orgId: campaign.orgId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  const order = await prisma.order.create({
    data: {
      orgId: campaign.orgId,
      campaignId: campaign.id,
      donorId,
      orderNumber: createOrderNumber(),
      status: totalAmount > 0 ? OrderStatus.PENDING : OrderStatus.PAID,
      totalAmount: normalized.totalAmount,
      currency,
      coverFeesAmount: 0,
      lineItems: {
        create: normalized.items.map((item) => ({
          orgId: campaign.orgId,
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

  const ticketOrder = await prisma.ticketOrder.create({
    data: {
      orgId: campaign.orgId,
      campaignId: campaign.id,
      orderId: order.id,
      ticketTypeId: ticketType.id,
      quantity,
      unitAmount,
      totalAmount,
    },
  });

  if (quantity > 0) {
    const attendees = Array.from({ length: quantity }).map(() => ({
      orgId: campaign.orgId,
      campaignId: campaign.id,
      orderId: order.id,
      ticketOrderId: ticketOrder.id,
      ticketTypeId: ticketType.id,
      donorId,
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
      status: "REGISTERED" as const,
    }));

    await prisma.attendee.createMany({
      data: attendees,
    });
  }

  if (totalAmount <= 0) {
    await prisma.payment.create({
      data: {
        orgId: campaign.orgId,
        orderId: order.id,
        provider: PaymentProvider.MANUAL,
        status: PaymentStatus.SUCCEEDED,
        amount: 0,
        currency,
        netAmount: 0,
        capturedAt: new Date(),
      },
    });

    redirect(`/campaigns/${campaign.slug}/tickets?success=1&orderId=${order.id}`);
  }

  const payment = await prisma.payment.create({
    data: {
      orgId: campaign.orgId,
      orderId: order.id,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.REQUIRES_PAYMENT,
      amount: normalized.totalAmount,
      currency,
      netAmount: normalized.totalAmount,
    },
  });

  const origin = resolveOrigin();
  if (!origin) {
    throw new Error("Missing request origin.");
  }

  const successUrl = `${origin}/campaigns/${campaign.slug}/tickets?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${campaign.slug}/tickets?canceled=1`;

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "pay",
    customer_email: email || undefined,
    line_items: normalized.items.map((item) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.description ?? "Ticket",
        },
        unit_amount: item.unitAmount,
      },
      quantity: item.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    payment_intent_data: {
      metadata: {
        orgId: campaign.orgId,
        orderId: order.id,
        paymentId: payment.id,
        campaignId: campaign.id,
        ticketTypeId: ticketType.id,
        ...(donorId ? { donorId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  redirect(session.url);
}
