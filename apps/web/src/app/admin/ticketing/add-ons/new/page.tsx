import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTicketAddOn } from "./add-on-actions";

export default async function NewTicketAddOnPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          Create add-on
        </h1>
        <p className="text-sm text-stone-600">
          Add optional extras to ticket checkout.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createTicketAddOn(formData);
          redirect(`/admin/ticketing/add-ons?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Campaign
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            required
          >
            <option value="" disabled>
              Select a campaign
            </option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Drink tickets"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Description
          <textarea
            name="description"
            rows={3}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Bundle of 2 drink tickets per guest."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Price (USD)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Leave empty for unlimited"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Scope
            <select
              name="scope"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            >
              <option value="ORDER">Per order</option>
              <option value="ATTENDEE">Per attendee</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-amber-300 text-teal-600"
            />
            Active add-on
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save add-on
        </button>
      </form>
    </div>
  );
}
