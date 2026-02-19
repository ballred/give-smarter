import type { ReceiptType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/receipt-template";
import { getPortalDonors } from "../portal-data";

type ReceiptMeta = {
  totalAmount?: number;
  taxDeductibleAmount?: number;
  currency?: string;
};

function getReceiptLabel(receiptType: ReceiptType) {
  switch (receiptType) {
    case "YEAR_END":
      return "Year-end summary";
    default:
      return "Receipt";
  }
}

export default async function DonorReceiptsPage() {
  const portal = await getPortalDonors();
  const donorIds = portal?.donors.map((donor) => donor.id) ?? [];

  const receipts = donorIds.length
    ? await prisma.receipt.findMany({
        where: { donorId: { in: donorIds } },
        include: {
          order: { select: { totalAmount: true, currency: true } },
          organization: { select: { publicName: true, legalName: true } },
        },
        orderBy: { issuedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Receipts</h1>
        <p className="text-sm text-stone-600">
          Download transaction receipts and annual summaries.
        </p>
      </header>

      {!receipts.length ? (
        <div className="rounded-2xl border border-dashed border-amber-200/60 bg-white p-6 text-sm text-stone-500">
          Transaction receipts and year-end summaries will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => {
            const metadata = (receipt.metadata ?? {}) as ReceiptMeta;
            const currency =
              metadata.currency ??
              receipt.order?.currency ??
              "USD";
            const totalAmount =
              metadata.totalAmount ?? receipt.order?.totalAmount ?? 0;
            const deductibleAmount = metadata.taxDeductibleAmount ?? 0;
            const orgName =
              receipt.organization.publicName ||
              receipt.organization.legalName;

            return (
              <div
                key={receipt.id}
                className="rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-stone-900">
                      {getReceiptLabel(receipt.receiptType)} |{" "}
                      {receipt.receiptNumber}
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {orgName}
                    </p>
                    <p className="text-xs text-stone-500">
                      Issued {formatDate(receipt.issuedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">
                      {formatCurrency(totalAmount, currency)}
                    </p>
                    <p className="text-xs text-stone-500">
                      Tax deductible{" "}
                      {formatCurrency(deductibleAmount, currency)}
                    </p>
                    {receipt.documentUrl ? (
                      <a
                        href={receipt.documentUrl}
                        className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 hover:text-teal-700"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="mt-2 inline-flex items-center text-xs uppercase tracking-[0.2em] text-stone-400">
                        PDF pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
