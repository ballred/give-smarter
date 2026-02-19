import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SmsTemplatesPage() {
  const templates = await prisma.smsTemplate.findMany({
    include: { organization: { select: { publicName: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">SMS templates</h1>
          <p className="text-sm text-stone-600">
            Keep text messages concise and on brand.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href="/admin/messaging/sms/new"
        >
          New template
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Preview</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Version</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Updated</th>
            </tr>
          </thead>
          <tbody>
            {templates.length ? (
              templates.map((template) => (
                <tr key={template.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      className="text-stone-900 hover:text-stone-700"
                      href={`/admin/messaging/sms/${template.id}`}
                    >
                      {template.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {template.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {template.body.length > 60
                      ? `${template.body.slice(0, 60)}…`
                      : template.body}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {template.status}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    v{template.version}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500" colSpan={6}>
                  No templates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
