import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateWebhook, webhookEvents } from "../webhook-actions";

function isEventSelected(events: string[], event: string) {
  return events.includes(event);
}

export default async function WebhookDetailPage({
  params,
  searchParams,
}: {
  params: { webhookId: string };
  searchParams?: { secret?: string };
}) {
  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: params.webhookId },
    include: { organization: { select: { publicName: true } } },
  });

  if (!webhook) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {webhook.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">Webhook</h1>
        <p className="text-sm text-zinc-600">Status: {webhook.status}</p>
      </header>

      {searchParams?.secret ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">Webhook secret generated</p>
          <p className="mt-2 break-all font-mono text-xs text-emerald-800">
            {searchParams.secret}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Copy this secret now. You won&apos;t be able to see it again.
          </p>
        </div>
      ) : null}

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateWebhook(webhook.id, formData);
          redirect(`/admin/integrations/webhooks/${webhook.id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Endpoint URL
          <input
            name="url"
            type="url"
            required
            defaultValue={webhook.url}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-700">Events</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {webhookEvents.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="events"
                  value={event}
                  defaultChecked={isEventSelected(webhook.events, event)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
                <span className="text-zinc-700">{event}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold text-zinc-700">
          Status
          <select
            name="status"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            defaultValue={webhook.status}
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update webhook
        </button>
      </form>
    </div>
  );
}
