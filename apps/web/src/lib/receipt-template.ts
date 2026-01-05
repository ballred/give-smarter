type ReceiptTemplateInput = {
  orgName: string;
  donorName?: string;
  receiptNumber: string;
  issuedAt: Date;
  totalAmount: number;
  taxDeductibleAmount: number;
  benefitAmount: number;
  currency: string;
  receiptUrl?: string;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export function formatDate(date: Date) {
  return DATE_FORMATTER.format(date);
}

export function formatCurrency(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });

  return formatter.format(amount / 100);
}

export function buildReceiptEmailHtml(input: ReceiptTemplateInput) {
  const receiptUrlSection = input.receiptUrl
    ? `<p><a href="${input.receiptUrl}">Download PDF receipt</a></p>`
    : "";
  const greeting = input.donorName ? `Hi ${input.donorName},` : "Hi there,";

  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
    <p>${greeting}</p>
    <p>Thank you for your support of ${input.orgName}. Your receipt is below.</p>
    <table style="border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 4px 12px 4px 0;">Receipt number</td>
        <td style="padding: 4px 0;">${input.receiptNumber}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;">Date</td>
        <td style="padding: 4px 0;">${formatDate(input.issuedAt)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;">Total</td>
        <td style="padding: 4px 0;">${formatCurrency(
          input.totalAmount,
          input.currency,
        )}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;">Tax deductible</td>
        <td style="padding: 4px 0;">${formatCurrency(
          input.taxDeductibleAmount,
          input.currency,
        )}</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0;">Benefits value</td>
        <td style="padding: 4px 0;">${formatCurrency(
          input.benefitAmount,
          input.currency,
        )}</td>
      </tr>
    </table>
    ${receiptUrlSection}
    <p>Thank you for helping us move our mission forward.</p>
  </body>
</html>`;
}

export function buildReceiptEmailText(input: ReceiptTemplateInput) {
  const lines = [
    input.donorName ? `Hi ${input.donorName},` : "Hi there,",
    "",
    `Thank you for your support of ${input.orgName}.`,
    `Receipt number: ${input.receiptNumber}`,
    `Date: ${formatDate(input.issuedAt)}`,
    `Total: ${formatCurrency(input.totalAmount, input.currency)}`,
    `Tax deductible: ${formatCurrency(
      input.taxDeductibleAmount,
      input.currency,
    )}`,
    `Benefits value: ${formatCurrency(input.benefitAmount, input.currency)}`,
  ];

  if (input.receiptUrl) {
    lines.push(`PDF: ${input.receiptUrl}`);
  }

  lines.push("", "Thank you for helping us move our mission forward.");

  return lines.join("\n");
}
