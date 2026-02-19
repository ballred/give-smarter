import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createWebhook, webhookEvents } from "../webhook-actions";

export default async function NewWebhookPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, publicName: true },
  });

  if (!organizations.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">New webhook</h1>
        <p className="text-sm text-stone-600">
          Create an organization before adding webhooks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">New webhook</h1>
        <p className="text-sm text-stone-600">
          Subscribe to events and deliver signed payloads.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const result = await createWebhook(formData);
          redirect(`/admin/integrations/webhooks/${result.id}?secret=${result.secret}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Organization
          <select
            name="orgId"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            required
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.publicName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Endpoint URL
          <input
            name="url"
            type="url"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="https://example.com/webhooks/givesmarter"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-stone-700">Events</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {webhookEvents.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="events"
                  value={event}
                  className="h-4 w-4 rounded border-amber-300 text-teal-600"
                />
                <span className="text-stone-700">{event}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold text-stone-700">
          Status
          <select
            name="status"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            defaultValue="ACTIVE"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Create webhook
        </button>
      </form>
    </div>
  );
}
