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

function parseAmount(value: FormDataEntryValue | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function parseSelection(selection: string) {
  const [contestId, candidateId] = selection.split("|");
  return { contestId, candidateId };
}

export async function createVoteCheckout(formData: FormData) {
  "use server";

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const selection = String(formData.get("selection") ?? "").trim();
  const amountInput = parseAmount(formData.get("amount"));
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  const { contestId, candidateId } = parseSelection(selection);

  if (!campaignId || !contestId || !candidateId || amountInput === null) {
    throw new Error("Candidate and amount are required.");
  }

  const amountCents = Math.round(amountInput * 100);
  if (amountCents <= 0) {
    throw new Error("Amount must be greater than zero.");
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

  const contest = await prisma.votingContest.findUnique({
    where: { id: contestId },
  });

  if (!contest || contest.campaignId !== campaign.id) {
    throw new Error("Contest not found.");
  }

  const candidate = await prisma.voteCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate || candidate.contestId !== contest.id) {
    throw new Error("Candidate not found.");
  }

  const currency = campaign.organization.defaultCurrency ?? "USD";
  const voteCount = Math.max(1, Math.round(amountCents / 100));

  const normalized = normalizeLineItems(
    [
      {
        type: "DONATION" as LineItemType,
        sourceId: candidate.id,
        description: `Vote for ${candidate.name}`,
        unitAmount: amountCents,
        totalAmount: amountCents,
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
          metadata: { candidateId: candidate.id },
        })),
      },
    },
  });

  await prisma.vote.create({
    data: {
      orgId: campaign.orgId,
      contestId: contest.id,
      candidateId: candidate.id,
      donorId,
      amount: amountCents,
      voteCount,
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

  const successUrl = `${origin}/campaigns/${campaign.slug}/voting?success=1&orderId=${order.id}`;
  const cancelUrl = `${origin}/campaigns/${campaign.slug}/voting?canceled=1`;

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    customer_email: email || undefined,
    line_items: normalized.items.map((item) => ({
      price_data: {
        currency: item.currency.toLowerCase(),
        product_data: {
          name: item.description ?? "Vote",
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
        contestId: contest.id,
        candidateId: candidate.id,
        ...(donorId ? { donorId } : {}),
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to start checkout session.");
  }

  redirect(session.url);
}
