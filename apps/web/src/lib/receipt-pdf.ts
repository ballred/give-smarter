import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency, formatDate } from "@/lib/receipt-template";

type ReceiptLineItem = {
  description: string;
  quantity: number;
  totalAmount: number;
};

export type ReceiptPdfData = {
  orgName: string;
  receiptNumber: string;
  issuedAt: Date;
  donorName?: string;
  totalAmount: number;
  taxDeductibleAmount: number;
  benefitAmount: number;
  currency: string;
  lineItems: ReceiptLineItem[];
};

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export async function buildReceiptPdf(data: ReceiptPdfData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 48;

  page.drawText(data.orgName, {
    x: 48,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 28;

  page.drawText("Receipt", {
    x: 48,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 20;

  const headerLines = [
    `Receipt number: ${data.receiptNumber}`,
    `Date: ${formatDate(data.issuedAt)}`,
    data.donorName ? `Donor: ${data.donorName}` : undefined,
  ].filter(Boolean) as string[];

  for (const line of headerLines) {
    page.drawText(line, {
      x: 48,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 16;
  }

  y -= 8;

  page.drawText("Items", {
    x: 48,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  y -= 16;

  if (data.lineItems.length === 0) {
    page.drawText("No line items available.", {
      x: 48,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 16;
  } else {
    for (const item of data.lineItems) {
      const description = truncateText(item.description, 70);
      const line = `- ${description} (x${item.quantity})`;
      const amount = formatCurrency(item.totalAmount, data.currency);

      page.drawText(line, {
        x: 48,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(amount, {
        x: 440,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      y -= 16;

      if (y < 80) {
        break;
      }
    }
  }

  y -= 8;

  const totals = [
    `Total: ${formatCurrency(data.totalAmount, data.currency)}`,
    `Tax deductible: ${formatCurrency(
      data.taxDeductibleAmount,
      data.currency,
    )}`,
    `Benefits value: ${formatCurrency(data.benefitAmount, data.currency)}`,
  ];

  for (const line of totals) {
    page.drawText(line, {
      x: 48,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 16;
  }

  y -= 8;

  page.drawText("Thank you for your support.", {
    x: 48,
    y,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdfDoc.save();
}
