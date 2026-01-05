import { ReceiptType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  buildReceiptEmailHtml,
  buildReceiptEmailText,
} from "@/lib/receipt-template";

type IssueReceiptInput = {
  orgId: string;
  orderId: string;
  donorId?: string;
  issuedAt: Date;
  paymentId?: string;
  paymentIntentId?: string;
  receiptEmail?: string;
};

type DonorProfile = {
  preferredName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  primaryEmail?: string | null;
};

function buildReceiptNumber(orderNumber?: string) {
  if (orderNumber) {
    return `R-${orderNumber}`;
  }

  const dateStamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `R-${dateStamp}-${random}`;
}

function getAppUrl() {
  const value =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000";

  return value.replace(/\/$/, "");
}

function buildReceiptUrl(receiptId: string) {
  return `${getAppUrl()}/api/receipts/${receiptId}/pdf`;
}

function getDonorName(donor?: DonorProfile | null) {
  if (!donor) {
    return undefined;
  }

  if (donor.preferredName) {
    return donor.preferredName;
  }

  const nameParts = [donor.firstName, donor.lastName].filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts.join(" ");
  }

  return donor.displayName ?? undefined;
}

export async function issueReceiptForOrder(input: IssueReceiptInput) {
  const existing = await prisma.receipt.findFirst({
    where: {
      orgId: input.orgId,
      orderId: input.orderId,
      receiptType: ReceiptType.TRANSACTIONAL,
    },
  });

  if (existing) {
    if (!existing.documentUrl) {
      const receiptUrl = buildReceiptUrl(existing.id);
      const metadata =
        (existing.metadata as Record<string, unknown> | null) ?? {};

      return prisma.receipt.update({
        where: { id: existing.id },
        data: {
          documentUrl: receiptUrl,
          metadata: { ...metadata, receiptUrl },
        },
      });
    }

    return existing;
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { lineItems: true, donor: true, organization: true },
  });

  if (!order) {
    return null;
  }

  const totalAmount = order.lineItems.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );
  const taxDeductibleAmount = order.lineItems.reduce(
    (sum, item) => sum + item.taxDeductibleAmount,
    0,
  );
  const benefitAmount = order.lineItems.reduce(
    (sum, item) => sum + item.benefitAmount,
    0,
  );
  const fmvAmount = order.lineItems.reduce(
    (sum, item) => sum + item.fmvAmount,
    0,
  );

  const receiptEmail =
    input.receiptEmail?.trim() ||
    order.donor?.primaryEmail?.trim() ||
    undefined;
  const receipt = await prisma.receipt.create({
    data: {
      orgId: input.orgId,
      donorId: order.donorId ?? input.donorId,
      orderId: input.orderId,
      receiptType: ReceiptType.TRANSACTIONAL,
      receiptNumber: buildReceiptNumber(order.orderNumber),
      issuedAt: input.issuedAt,
      year: input.issuedAt.getUTCFullYear(),
      metadata: {
        orderNumber: order.orderNumber,
        totalAmount,
        taxDeductibleAmount,
        benefitAmount,
        fmvAmount,
        currency: order.currency,
        receiptEmail,
        paymentId: input.paymentId,
        paymentIntentId: input.paymentIntentId,
        lineItemCount: order.lineItems.length,
      },
    },
  });

  const receiptUrl = buildReceiptUrl(receipt.id);
  const orgName = order.organization?.publicName ?? order.organization?.legalName;
  const donorName = getDonorName(order.donor);
  const metadata = (receipt.metadata as Record<string, unknown>) ?? {};

  if (receiptEmail && orgName) {
    try {
      await sendEmail({
        to: receiptEmail,
        subject: `Receipt from ${orgName}`,
        html: buildReceiptEmailHtml({
          orgName,
          donorName,
          receiptNumber: receipt.receiptNumber,
          issuedAt: input.issuedAt,
          totalAmount,
          taxDeductibleAmount,
          benefitAmount,
          currency: order.currency,
          receiptUrl,
        }),
        text: buildReceiptEmailText({
          orgName,
          donorName,
          receiptNumber: receipt.receiptNumber,
          issuedAt: input.issuedAt,
          totalAmount,
          taxDeductibleAmount,
          benefitAmount,
          currency: order.currency,
          receiptUrl,
        }),
      });

      metadata.emailSentAt = new Date().toISOString();
    } catch (error) {
      const message = error instanceof Error ? error.message : "email_failed";
      console.error("Receipt email failed", message);
      metadata.emailError = message;
    }
  }

  return prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      documentUrl: receiptUrl,
      metadata: { ...metadata, receiptUrl },
    },
  });
}
