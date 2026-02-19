import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateSmsTemplate } from "../template-actions";

export default async function SmsTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const resolvedParams = await params;
  const template = await prisma.smsTemplate.findUnique({
    where: { id: resolvedParams.templateId },
    include: { organization: { select: { publicName: true } } },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          {template.organization.publicName} · v{template.version}
        </p>
        <h1 className="text-2xl font-semibold text-stone-900">
          {template.name}
        </h1>
        <p className="text-sm text-stone-600">
          Last updated {new Date(template.updatedAt).toLocaleString()}
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateSmsTemplate(template.id, formData);
          redirect(`/admin/messaging/sms/${template.id}`);
        }}
      >
        <label className="block text-sm font-semibold text-stone-700">
          Template name
          <input
            name="name"
            type="text"
            required
            defaultValue={template.name}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Status
          <select
            name="status"
            defaultValue={template.status}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
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
            defaultValue={template.body}
            className="mt-2 w-full rounded-lg border border-amber-200/60 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Update template
        </button>
      </form>
    </div>
  );
}
