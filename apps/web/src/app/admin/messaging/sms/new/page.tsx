import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSmsTemplate } from "../template-actions";

export default async function NewSmsTemplatePage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, publicName: true },
  });

  if (!organizations.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">
          New SMS template
        </h1>
        <p className="text-sm text-stone-600">
          Create an organization first before adding templates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          New SMS template
        </h1>
        <p className="text-sm text-stone-600">
          Draft SMS messages for alerts and reminders.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createSmsTemplate(formData);
          redirect(`/admin/messaging/sms/${id}`);
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-stone-700">
            Template name
            <input
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Outbid alert"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Version
            <input
              name="version"
              type="number"
              min="1"
              defaultValue="1"
              className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Status
          <select
            name="status"
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            defaultValue="DRAFT"
          >
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          SMS body
          <textarea
            name="body"
            rows={6}
            required
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="You're outbid on Weekend Retreat Package. Tap to bid again: {{link}}"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Save template
        </button>
      </form>
    </div>
  );
}
