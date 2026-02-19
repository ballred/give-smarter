import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function WebhooksPage() {
  const webhooks = await prisma.webhookEndpoint.findMany({
    include: { organization: { select: { publicName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Webhooks</h1>
          <p className="text-sm text-stone-600">
            Send event payloads to external systems.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href="/admin/integrations/webhooks/new"
        >
          New webhook
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">URL</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Events</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length ? (
              webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      className="text-stone-900 hover:text-stone-700"
                      href={`/admin/integrations/webhooks/${webhook.id}`}
                    >
                      {webhook.url}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {webhook.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {webhook.events.length} events
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {webhook.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500" colSpan={4}>
                  No webhooks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
