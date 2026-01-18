import { describe, expect, test } from "vitest";
import { createOrderNumber, mapSourceToLineItemType, normalizeLineItems } from "./orders";

describe("mapSourceToLineItemType", () => {
  test("maps donation source", () => {
    expect(mapSourceToLineItemType("donation")).toBe("DONATION");
  });

  test("maps ticket source", () => {
    expect(mapSourceToLineItemType("ticket")).toBe("TICKET");
  });

  test("maps auction source", () => {
    expect(mapSourceToLineItemType("auction")).toBe("AUCTION_WIN");
  });
});

describe("createOrderNumber", () => {
  test("returns a formatted order number", () => {
    const orderNumber = createOrderNumber();
    expect(orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
  });
});

describe("normalizeLineItems", () => {
  test("normalizes quantities, rounds amounts, and computes totals", () => {
    const { items, totalAmount, taxDeductibleAmount } = normalizeLineItems(
      [
        {
          type: "DONATION",
          description: "Donation",
          unitAmount: 1000.4,
          taxDeductibleAmount: 1000,
        },
        {
          type: "TICKET",
          description: "Ticket",
          quantity: 2,
          unitAmount: 2500.6,
          totalAmount: 5001.2,
          benefitAmount: 500,
          taxDeductibleAmount: 4500,
        },
      ],
      "USD",
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.quantity).toBe(1);
    expect(items[0]?.unitAmount).toBe(1000);
    expect(items[0]?.totalAmount).toBe(1000);
    expect(items[0]?.currency).toBe("USD");

    expect(items[1]?.quantity).toBe(2);
    expect(items[1]?.unitAmount).toBe(2501);
    expect(items[1]?.totalAmount).toBe(5001);
    expect(items[1]?.benefitAmount).toBe(500);

    expect(totalAmount).toBe(6001);
    expect(taxDeductibleAmount).toBe(5500);
  });
});
