import Link from "next/link";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function FinanceReportPage() {
  const payments = await prisma.payment.findMany({
    include: {
      order: {
        include: {
          donor: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const succeeded = payments.filter(
    (p) => p.status === PaymentStatus.SUCCEEDED
  );
  const totalCollected = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = succeeded.reduce((sum, p) => sum + (p.feeAmount ?? 0), 0);
  const totalNet = succeeded.reduce((sum, p) => sum + p.netAmount, 0);
  const refunded = payments.filter(
    (p) =>
      p.status === PaymentStatus.REFUNDED ||
      p.status === PaymentStatus.PARTIALLY_REFUNDED
  );
  const refundCount = refunded.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">
            Finance Report
          </h1>
          <p className="text-sm text-stone-600">
            Overview of payments, fees, and net revenue.
          </p>
        </div>
        <a
          href="/api/admin/reports/finance?format=csv"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Export CSV
        </a>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Total Collected
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {formatCurrency(totalCollected)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {succeeded.length} successful payments
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Processing Fees
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {formatCurrency(totalFees)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {totalCollected > 0
              ? ((totalFees / totalCollected) * 100).toFixed(1)
              : "0"}
            % of gross
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Net Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalNet)}
          </p>
          <p className="mt-1 text-xs text-stone-500">After fees</p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Refunds
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-900">{refundCount}</p>
          <p className="mt-1 text-xs text-stone-500">
            {payments.length > 0
              ? ((refundCount / payments.length) * 100).toFixed(1)
              : "0"}
            % refund rate
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <div className="border-b border-amber-200/60 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-amber-200/60 bg-amber-50/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Order</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Donor</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">
                  Amount
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">
                  Fee
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">
                  Net
                </th>
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => {
                  const donor = payment.order?.donor;
                  const donorName =
                    donor?.displayName ??
                    [donor?.firstName, donor?.lastName].filter(Boolean).join(" ") ??
                    "—";

                  return (
                    <tr key={payment.id} className="border-b border-amber-100">
                      <td className="px-4 py-3 text-stone-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {payment.orderId ? (
                          <Link
                            href={`/admin/orders/${payment.orderId}`}
                            className="text-stone-900 hover:text-stone-700"
                          >
                            {payment.order?.orderNumber ?? payment.orderId.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-stone-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-900">{donorName}</td>
                      <td className="px-4 py-3 text-right text-stone-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-500">
                        {formatCurrency(payment.feeAmount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-stone-900">
                        {formatCurrency(payment.netAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            payment.status === PaymentStatus.SUCCEEDED
                              ? "bg-emerald-100 text-emerald-700"
                              : payment.status === PaymentStatus.REFUNDED
                                ? "bg-amber-100 text-amber-700"
                                : payment.status === PaymentStatus.FAILED
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-stone-700"
                          }`}
                        >
                          {payment.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-stone-500"
                    colSpan={7}
                  >
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
