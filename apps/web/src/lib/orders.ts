import type { LineItemType } from "@prisma/client";

export type OrderLineItemInput = {
  type: LineItemType;
  sourceId?: string;
  description?: string;
  quantity?: number;
  unitAmount: number;
  totalAmount?: number;
  fmvAmount?: number;
  benefitAmount?: number;
  taxDeductibleAmount?: number;
  metadata?: Record<string, unknown>;
};

export type NormalizedLineItem = {
  type: LineItemType;
  sourceId?: string;
  description?: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  fmvAmount: number;
  benefitAmount: number;
  taxDeductibleAmount: number;
  currency: string;
  metadata?: Record<string, unknown>;
};

export function createOrderNumber() {
  const now = new Date();
  const dateStamp = `${now.getUTCFullYear()}${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${dateStamp}-${random}`;
}

export function mapSourceToLineItemType(
  source: "donation" | "ticket" | "auction",
): LineItemType {
  switch (source) {
    case "ticket":
      return "TICKET";
    case "auction":
      return "AUCTION_WIN";
    case "donation":
    default:
      return "DONATION";
  }
}

export function normalizeLineItems(
  items: OrderLineItemInput[],
  currency: string,
) {
  const normalized = items.map((item) => {
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const unitAmount = Math.round(item.unitAmount);
    const totalAmount =
      item.totalAmount !== undefined
        ? Math.round(item.totalAmount)
        : unitAmount * quantity;
    const fmvAmount = Math.round(item.fmvAmount ?? 0);
    const benefitAmount = Math.round(item.benefitAmount ?? 0);
    const taxDeductibleAmount = Math.round(item.taxDeductibleAmount ?? 0);

    return {
      type: item.type,
      sourceId: item.sourceId,
      description: item.description,
      quantity,
      unitAmount,
      totalAmount,
      fmvAmount,
      benefitAmount,
      taxDeductibleAmount,
      currency,
      metadata: item.metadata,
    } satisfies NormalizedLineItem;
  });

  const totalAmount = normalized.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );
  const taxDeductibleAmount = normalized.reduce(
    (sum, item) => sum + item.taxDeductibleAmount,
    0,
  );

  return { items: normalized, totalAmount, taxDeductibleAmount };
}
