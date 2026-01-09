import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    receiptId: string;
  }>;
};

function buildDonorName(donor: {
  preferredName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
} | null) {
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

export async function GET(_request: Request, { params }: RouteParams) {
  const { receiptId } = await params;

  if (!receiptId) {
    return NextResponse.json({ error: "missing_receipt_id" }, { status: 400 });
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      order: { include: { lineItems: true } },
      donor: true,
      organization: true,
    },
  });

  if (!receipt || !receipt.order || !receipt.organization) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const lineItems = receipt.order.lineItems ?? [];
  const totalAmount = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const taxDeductibleAmount = lineItems.reduce(
    (sum, item) => sum + item.taxDeductibleAmount,
    0,
  );
  const benefitAmount = lineItems.reduce(
    (sum, item) => sum + item.benefitAmount,
    0,
  );

  const pdfBytes = await buildReceiptPdf({
    orgName: receipt.organization.publicName ?? receipt.organization.legalName,
    receiptNumber: receipt.receiptNumber,
    issuedAt: receipt.issuedAt,
    donorName: buildDonorName(receipt.donor),
    totalAmount,
    taxDeductibleAmount,
    benefitAmount,
    currency: receipt.order.currency,
    lineItems: lineItems.map((item) => ({
      description: item.description ?? item.type,
      quantity: item.quantity,
      totalAmount: item.totalAmount,
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
    },
  });
}
