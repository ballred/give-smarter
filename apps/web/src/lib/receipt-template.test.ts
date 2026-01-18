import { describe, expect, test } from "vitest";
import { buildReceiptEmailHtml, buildReceiptEmailText, formatCurrency } from "./receipt-template";

describe("formatCurrency", () => {
  test("formats cents into currency strings", () => {
    expect(formatCurrency(12345, "USD")).toBe("$123.45");
  });
});

describe("buildReceiptEmailText", () => {
  test("includes receipt metadata and pdf link", () => {
    const text = buildReceiptEmailText({
      orgName: "Test Org",
      donorName: "Ada",
      receiptNumber: "R-ORD-20250101-ABC123",
      issuedAt: new Date("2025-01-01T00:00:00Z"),
      totalAmount: 12345,
      taxDeductibleAmount: 12000,
      benefitAmount: 345,
      currency: "USD",
      receiptUrl: "https://example.com/receipt.pdf",
    });

    expect(text).toContain("Receipt number: R-ORD-20250101-ABC123");
    expect(text).toContain("Total: $123.45");
    expect(text).toContain("Tax deductible: $120.00");
    expect(text).toContain("Benefits value: $3.45");
    expect(text).toContain("PDF: https://example.com/receipt.pdf");
  });
});

describe("buildReceiptEmailHtml", () => {
  test("renders a clickable receipt link", () => {
    const html = buildReceiptEmailHtml({
      orgName: "Test Org",
      receiptNumber: "R-1",
      issuedAt: new Date("2025-01-01T00:00:00Z"),
      totalAmount: 100,
      taxDeductibleAmount: 100,
      benefitAmount: 0,
      currency: "USD",
      receiptUrl: "https://example.com/receipt.pdf",
    });

    expect(html).toContain('href="https://example.com/receipt.pdf"');
  });
});

