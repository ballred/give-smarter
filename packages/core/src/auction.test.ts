import { describe, expect, test } from "vitest";
import { getBidIncrement, resolveProxyBid } from "./auction";

describe("getBidIncrement", () => {
  test("returns default increments by tier", () => {
    expect(getBidIncrement(0)).toBe(5);
    expect(getBidIncrement(99)).toBe(5);
    expect(getBidIncrement(100)).toBe(10);
    expect(getBidIncrement(500)).toBe(25);
    expect(getBidIncrement(5000)).toBe(250);
  });

  test("sorts rules before evaluating", () => {
    const rules = [
      { increment: 25 },
      { upTo: 99, increment: 5 },
      { upTo: 499, increment: 10 },
    ];

    expect(getBidIncrement(50, rules)).toBe(5);
    expect(getBidIncrement(200, rules)).toBe(10);
    expect(getBidIncrement(999, rules)).toBe(25);
  });
});

describe("resolveProxyBid", () => {
  test("handles first bid", () => {
    const placedAt = new Date("2025-01-01T00:00:00Z");
    const result = resolveProxyBid(null, {
      bidderId: "bidder_a",
      bidAmount: 100,
      placedAt,
    });

    expect(result).toEqual({
      winningBidderId: "bidder_a",
      winningBidAmount: 100,
      winningMaxBidAmount: 100,
      outbidBidderId: undefined,
      outbidMaxBidAmount: undefined,
      isTie: false,
    });
  });

  test("updates max for same bidder without changing current bid", () => {
    const placedAt = new Date("2025-01-01T00:00:00Z");
    const result = resolveProxyBid(
      {
        bidderId: "bidder_a",
        currentBidAmount: 100,
        maxBidAmount: 200,
        maxBidPlacedAt: placedAt,
      },
      {
        bidderId: "bidder_a",
        bidAmount: 150,
        maxBidAmount: 300,
        placedAt: new Date("2025-01-01T00:00:05Z"),
      },
    );

    expect(result.winningBidderId).toBe("bidder_a");
    expect(result.winningBidAmount).toBe(100);
    expect(result.winningMaxBidAmount).toBe(300);
    expect(result.isTie).toBe(false);
  });

  test("incoming bidder wins and bumps current max by increment", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const result = resolveProxyBid(
      {
        bidderId: "bidder_a",
        currentBidAmount: 100,
        maxBidAmount: 200,
        maxBidPlacedAt: now,
      },
      {
        bidderId: "bidder_b",
        bidAmount: 120,
        maxBidAmount: 500,
        placedAt: new Date("2025-01-01T00:00:03Z"),
      },
    );

    expect(result.winningBidderId).toBe("bidder_b");
    expect(result.winningBidAmount).toBe(210);
    expect(result.winningMaxBidAmount).toBe(500);
    expect(result.outbidBidderId).toBe("bidder_a");
    expect(result.outbidMaxBidAmount).toBe(200);
    expect(result.isTie).toBe(false);
  });

  test("current bidder wins and auto-bids up to incoming max plus increment", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const result = resolveProxyBid(
      {
        bidderId: "bidder_a",
        currentBidAmount: 100,
        maxBidAmount: 500,
        maxBidPlacedAt: now,
      },
      {
        bidderId: "bidder_b",
        bidAmount: 120,
        maxBidAmount: 300,
        placedAt: new Date("2025-01-01T00:00:03Z"),
      },
    );

    expect(result.winningBidderId).toBe("bidder_a");
    expect(result.winningBidAmount).toBe(310);
    expect(result.winningMaxBidAmount).toBe(500);
    expect(result.outbidBidderId).toBe("bidder_b");
    expect(result.outbidMaxBidAmount).toBe(300);
    expect(result.isTie).toBe(false);
  });

  test("breaks ties by earliest max bid placement", () => {
    const result = resolveProxyBid(
      {
        bidderId: "bidder_a",
        currentBidAmount: 100,
        maxBidAmount: 500,
        maxBidPlacedAt: new Date("2025-01-01T00:00:10Z"),
      },
      {
        bidderId: "bidder_b",
        bidAmount: 120,
        maxBidAmount: 500,
        placedAt: new Date("2025-01-01T00:00:05Z"),
      },
    );

    expect(result.isTie).toBe(true);
    expect(result.winningBidAmount).toBe(500);
    expect(result.winningBidderId).toBe("bidder_b");
    expect(result.outbidBidderId).toBe("bidder_a");
  });
});

