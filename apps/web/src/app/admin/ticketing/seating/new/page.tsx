import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTable } from "./seating-actions";

export default async function NewTablePage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Create table</h1>
        <p className="text-sm text-zinc-600">
          Set capacity and generate numbered seats automatically.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createTable(formData);
          redirect(`/admin/ticketing/seating?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Campaign
          <select
            name="campaignId"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
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

        <label className="block text-sm font-semibold text-zinc-700">
          Table name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="Table 12"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Capacity
          <input
            name="capacity"
            type="number"
            min="1"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Notes
          <textarea
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            placeholder="Reserved for sponsors."
          />
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
          <input
            name="generateSeats"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
          />
          Auto-generate seat numbers
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save table
        </button>
      </form>
    </div>
  );
}
