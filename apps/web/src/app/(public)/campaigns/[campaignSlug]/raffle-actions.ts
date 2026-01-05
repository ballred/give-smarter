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

export async function createRaffleCheckout(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const raffleId = String(formData.get("raffleId") ?? "").trim();
  const quantity = parseQuantity(formData.get("quantity")) ?? 1;
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!campaignId || !raffleId) {
    throw new Error("Raffle selection is required.");
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

  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
  });

  if (!raffle || raffle.campaignId !== campaign.id) {
    throw new Error("Raffle not found.");
  }

  const unitAmount = raffle.ticketPrice;
  const totalAmount = unitAmount * quantity;
  const currency = campaign.organization.defaultCurrency ?? "USD";

  const normalized = normalizeLineItems(
    [
      {
        type: "RAFFLE_TICKET" as LineItemType,
        sourceId: raffle.id,
        description: `${raffle.name} tickets`,
        quantity,
        unitAmount,
        totalAmount,
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
      status: OrderStatus.PENDING,
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
        })),
      },
    },
  });

  await prisma.raffleTicket.create({
    data: {
      orgId: campaign.orgId,
      raffleId: raffle.id,
      donorId,
      orderId: order.id,
      quantity,
    },
  });

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

  const successUrl = `${origin}/campaigns/${campaign.slug}/raffle?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${campaign.slug}/raffle?canceled=1`;

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "pay",
    customer_email: email || undefined,
    line_items: normalized.items.map((item) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.description ?? "Raffle tickets",
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
        raffleId: raffle.id,
        ...(donorId ? { donorId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  redirect(session.url);
}
