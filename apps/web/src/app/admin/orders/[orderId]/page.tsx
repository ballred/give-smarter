import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.orderId },
    include: {
      donor: true,
      campaign: { select: { name: true } },
      lineItems: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    notFound();
  }

  const donorName =
    order.donor?.displayName ||
    [order.donor?.firstName, order.donor?.lastName].filter(Boolean).join(" ") ||
    "—";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {order.campaign?.name ?? "Campaign"}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Order {order.orderNumber}
        </h1>
        <p className="text-sm text-zinc-600">
          Status: {order.status} · Total:{" "}
          {formatCurrency(order.totalAmount, order.currency)}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Donor
          </h2>
          <p className="mt-3 text-base font-semibold text-zinc-900">{donorName}</p>
          <p className="text-sm text-zinc-600">{order.donor?.primaryEmail ?? "—"}</p>
          <p className="text-sm text-zinc-600">{order.donor?.primaryPhone ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Timing
          </h2>
          <p className="mt-3 text-sm text-zinc-700">
            Created: {new Date(order.createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-zinc-700">
            Updated: {new Date(order.updatedAt).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">Type</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Description</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.length ? (
                order.lineItems.map((lineItem) => (
                  <tr key={lineItem.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-700">{lineItem.type}</td>
                    <td className="px-4 py-3 text-zinc-900">
                      {lineItem.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">
                      {lineItem.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900">
                      {formatCurrency(lineItem.totalAmount, lineItem.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                    No line items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Provider</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                  Amount
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {order.payments.length ? (
                order.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-700">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{payment.provider}</td>
                    <td className="px-4 py-3 text-zinc-700">{payment.status}</td>
                    <td className="px-4 py-3 text-right text-zinc-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-900">
                      {formatCurrency(payment.netAmount, payment.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
