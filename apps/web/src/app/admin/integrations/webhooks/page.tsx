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
          <h1 className="text-2xl font-semibold text-zinc-900">Webhooks</h1>
          <p className="text-sm text-zinc-600">
            Send event payloads to external systems.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
          href="/admin/integrations/webhooks/new"
        >
          New webhook
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">URL</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Org</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Events</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length ? (
              webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      className="text-zinc-900 hover:text-zinc-700"
                      href={`/admin/integrations/webhooks/${webhook.id}`}
                    >
                      {webhook.url}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {webhook.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {webhook.events.length} events
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {webhook.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
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
