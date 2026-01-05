import {
  LedgerAccountType,
  LedgerEntryType,
  type LedgerTransaction,
} from "@prisma/client";
import { prisma } from "@/lib/db";

const LEDGER_ACCOUNT_NAMES: Record<LedgerAccountType, string> = {
  OPERATING: "Operating",
  PROCESSOR_CLEARING: "Processor Clearing",
  PLATFORM_FEES: "Platform Fees",
  REFUNDS: "Refunds",
  PAYOUTS: "Payouts",
};

type LedgerBaseInput = {
  orgId: string;
  amount: number;
  currency: string;
  occurredAt: Date;
};

type PaymentCaptureInput = LedgerBaseInput & {
  paymentId: string;
};

type RefundLedgerInput = LedgerBaseInput & {
  paymentId: string;
  refundId: string;
};

type PayoutLedgerInput = LedgerBaseInput & {
  payoutId: string;
};

async function ensureLedgerAccount(orgId: string, type: LedgerAccountType) {
  const existing = await prisma.ledgerAccount.findFirst({
    where: { orgId, type },
  });

  if (existing) {
    return existing;
  }

  return prisma.ledgerAccount.create({
    data: {
      orgId,
      type,
      name: LEDGER_ACCOUNT_NAMES[type],
      isSystem: true,
    },
  });
}

async function ensureLedgerAccounts(
  orgId: string,
  types: LedgerAccountType[],
) {
  return Promise.all(types.map((type) => ensureLedgerAccount(orgId, type)));
}

export async function recordPaymentCapture(
  input: PaymentCaptureInput,
): Promise<LedgerTransaction | null> {
  const existing = await prisma.ledgerTransaction.findFirst({
    where: {
      orgId: input.orgId,
      paymentId: input.paymentId,
      type: "PAYMENT_CAPTURE",
    },
  });

  if (existing) {
    return existing;
  }

  const [clearing, operating] = await ensureLedgerAccounts(input.orgId, [
    "PROCESSOR_CLEARING",
    "OPERATING",
  ]);

  const transaction = await prisma.ledgerTransaction.create({
    data: {
      orgId: input.orgId,
      paymentId: input.paymentId,
      type: "PAYMENT_CAPTURE",
      amount: input.amount,
      currency: input.currency,
      occurredAt: input.occurredAt,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        orgId: input.orgId,
        ledgerAccountId: clearing.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.DEBIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "PAYMENT",
        referenceId: input.paymentId,
      },
      {
        orgId: input.orgId,
        ledgerAccountId: operating.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.CREDIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "PAYMENT",
        referenceId: input.paymentId,
      },
    ],
  });

  return transaction;
}

export async function recordRefundLedger(
  input: RefundLedgerInput,
): Promise<LedgerTransaction | null> {
  const existing = await prisma.ledgerTransaction.findFirst({
    where: {
      orgId: input.orgId,
      refundId: input.refundId,
      type: "PAYMENT_REFUND",
    },
  });

  if (existing) {
    return existing;
  }

  const [refunds, clearing] = await ensureLedgerAccounts(input.orgId, [
    "REFUNDS",
    "PROCESSOR_CLEARING",
  ]);

  const transaction = await prisma.ledgerTransaction.create({
    data: {
      orgId: input.orgId,
      paymentId: input.paymentId,
      refundId: input.refundId,
      type: "PAYMENT_REFUND",
      amount: input.amount,
      currency: input.currency,
      occurredAt: input.occurredAt,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        orgId: input.orgId,
        ledgerAccountId: refunds.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.DEBIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "REFUND",
        referenceId: input.refundId,
      },
      {
        orgId: input.orgId,
        ledgerAccountId: clearing.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.CREDIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "REFUND",
        referenceId: input.refundId,
      },
    ],
  });

  return transaction;
}

export async function recordPayoutLedger(
  input: PayoutLedgerInput,
): Promise<LedgerTransaction | null> {
  const existing = await prisma.ledgerTransaction.findFirst({
    where: {
      orgId: input.orgId,
      payoutId: input.payoutId,
      type: "PAYOUT",
    },
  });

  if (existing) {
    return existing;
  }

  const [payouts, clearing] = await ensureLedgerAccounts(input.orgId, [
    "PAYOUTS",
    "PROCESSOR_CLEARING",
  ]);

  const transaction = await prisma.ledgerTransaction.create({
    data: {
      orgId: input.orgId,
      payoutId: input.payoutId,
      type: "PAYOUT",
      amount: input.amount,
      currency: input.currency,
      occurredAt: input.occurredAt,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        orgId: input.orgId,
        ledgerAccountId: payouts.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.DEBIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "PAYOUT",
        referenceId: input.payoutId,
      },
      {
        orgId: input.orgId,
        ledgerAccountId: clearing.id,
        ledgerTransactionId: transaction.id,
        entryType: LedgerEntryType.CREDIT,
        amount: input.amount,
        currency: input.currency,
        occurredAt: input.occurredAt,
        referenceType: "PAYOUT",
        referenceId: input.payoutId,
      },
    ],
  });

  return transaction;
}
