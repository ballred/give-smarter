export type PaymentSource = "donation" | "ticket" | "auction";

export type CreatePaymentIntentInput = {
  amount: number;
  currency?: string;
  receiptEmail?: string;
  source?: PaymentSource;
  sourceId?: string;
  metadata?: Record<string, string>;
};
