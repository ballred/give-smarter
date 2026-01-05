import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  recordPaymentCapture,
  recordPayoutLedger,
  recordRefundLedger,
} from "@/lib/ledger";
import { issueReceiptForOrder } from "@/lib/receipts";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function metadataValue(metadata: Stripe.Metadata, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function findPayment({
  paymentId,
  paymentIntentId,
}: {
  paymentId?: string;
  paymentIntentId?: string;
}) {
  if (paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (payment) {
      return payment;
    }
  }

  if (paymentIntentId) {
    return prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
    });
  }

  return null;
}

async function updateRefundedPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { refunds: true },
  });

  if (!payment) {
    return;
  }

  const refundedAmount = payment.refunds.reduce(
    (sum, refund) => sum + refund.amount,
    0,
  );

  let status = PaymentStatus.SUCCEEDED;
  if (refundedAmount >= payment.amount) {
    status = PaymentStatus.REFUNDED;
  } else if (refundedAmount > 0) {
    status = PaymentStatus.PARTIALLY_REFUNDED;
  }

  if (status !== payment.status) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  }

  if (payment.orderId && status === PaymentStatus.REFUNDED) {
    await prisma.order.updateMany({
      where: { id: payment.orderId },
      data: { status: OrderStatus.REFUNDED },
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata ?? {};
  const orgId = metadataValue(metadata, "orgId");
  const orderId = metadataValue(metadata, "orderId");
  const paymentId = metadataValue(metadata, "paymentId");
  const donorId = metadataValue(metadata, "donorId");

  if (!orgId) {
    return;
  }

  const amount =
    paymentIntent.amount_received > 0
      ? paymentIntent.amount_received
      : paymentIntent.amount;
  const currency = paymentIntent.currency.toUpperCase();
  const occurredAt = new Date(paymentIntent.created * 1000);

  let payment = await findPayment({
    paymentId,
    paymentIntentId: paymentIntent.id,
  });

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        orgId,
        orderId,
        provider: PaymentProvider.STRIPE,
        providerPaymentId: paymentIntent.id,
        status: PaymentStatus.SUCCEEDED,
        amount,
        currency,
        netAmount: amount,
        capturedAt: occurredAt,
      },
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        providerPaymentId: paymentIntent.id,
        amount,
        currency,
        netAmount: amount,
        capturedAt: occurredAt,
      },
    });
  }

  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  }

  await recordPaymentCapture({
    orgId,
    paymentId: payment.id,
    amount,
    currency,
    occurredAt,
  });

  if (orderId) {
    await issueReceiptForOrder({
      orgId,
      orderId,
      donorId,
      issuedAt: occurredAt,
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
      receiptEmail: paymentIntent.receipt_email ?? undefined,
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata ?? {};
  const paymentId = metadataValue(metadata, "paymentId");
  const orderId = metadataValue(metadata, "orderId");

  const payment = await findPayment({
    paymentId,
    paymentIntentId: paymentIntent.id,
  });

  if (!payment) {
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.FAILED },
  });

  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { status: OrderStatus.PENDING },
    });
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata ?? {};
  const paymentId = metadataValue(metadata, "paymentId");
  const orderId = metadataValue(metadata, "orderId");

  const payment = await findPayment({
    paymentId,
    paymentIntentId: paymentIntent.id,
  });

  if (!payment) {
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.CANCELED },
  });

  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED },
    });
  }
}

async function handleRefund(refund: Stripe.Refund) {
  const paymentIntentId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const payment = await findPayment({
    paymentIntentId,
  });

  if (!payment) {
    return;
  }

  const processedAt = new Date(refund.created * 1000);
  const currency = refund.currency.toUpperCase();

  const existingRefund = await prisma.refund.findFirst({
    where: { providerRefundId: refund.id },
  });

  const refundRecord = existingRefund
    ? await prisma.refund.update({
        where: { id: existingRefund.id },
        data: {
          status: refund.status ?? existingRefund.status,
          amount: refund.amount,
          currency,
          processedAt,
        },
      })
    : await prisma.refund.create({
        data: {
          orgId: payment.orgId,
          paymentId: payment.id,
          providerRefundId: refund.id,
          status: refund.status ?? "processed",
          amount: refund.amount,
          currency,
          processedAt,
        },
      });

  await recordRefundLedger({
    orgId: payment.orgId,
    paymentId: payment.id,
    refundId: refundRecord.id,
    amount: refund.amount,
    currency,
    occurredAt: processedAt,
  });

  await updateRefundedPaymentStatus(payment.id);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const payment = await findPayment({ paymentIntentId });

  if (!payment) {
    return;
  }

  const refundedAmount = charge.amount_refunded ?? 0;
  const status =
    refundedAmount >= payment.amount
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status },
  });

  if (payment.orderId && status === PaymentStatus.REFUNDED) {
    await prisma.order.updateMany({
      where: { id: payment.orderId },
      data: { status: OrderStatus.REFUNDED },
    });
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const metadata = payout.metadata ?? {};
  const orgId = metadataValue(metadata, "orgId");

  if (!orgId) {
    return;
  }

  const arrivalDate = payout.arrival_date
    ? new Date(payout.arrival_date * 1000)
    : null;

  const existing = await prisma.payout.findFirst({
    where: {
      orgId,
      providerPayoutId: payout.id,
    },
  });

  const payoutRecord = existing
    ? await prisma.payout.update({
        where: { id: existing.id },
        data: {
          status: payout.status,
          amount: payout.amount,
          currency: payout.currency.toUpperCase(),
          arrivalDate,
        },
      })
    : await prisma.payout.create({
        data: {
          orgId,
          providerPayoutId: payout.id,
          status: payout.status,
          amount: payout.amount,
          currency: payout.currency.toUpperCase(),
          arrivalDate,
        },
      });

  await recordPayoutLedger({
    orgId,
    payoutId: payoutRecord.id,
    amount: payout.amount,
    currency: payout.currency.toUpperCase(),
    occurredAt: arrivalDate ?? new Date(),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(
        event.data.object as Stripe.PaymentIntent,
      );
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.canceled":
      await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
      break;
    case "charge.refund.updated":
    case "charge.refund.created":
      await handleRefund(event.data.object as Stripe.Refund);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case "payout.paid":
      await handlePayoutPaid(event.data.object as Stripe.Payout);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
