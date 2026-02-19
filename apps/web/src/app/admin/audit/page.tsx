import { prisma } from "@/lib/db";

export default async function AuditLogPage() {
  const entries = await prisma.auditLogEntry.findMany({
    include: {
      actor: { select: { email: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Audit log</h1>
          <p className="text-sm text-stone-600">
            Track admin actions and data changes across the platform.
          </p>
        </div>
        <a
          href="/api/admin/audit?format=csv"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Download CSV
        </a>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Time</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Actor</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Target</th>
              <th className="px-4 py-3 font-semibold text-stone-700">IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.length ? (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 text-stone-600">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {entry.actor?.displayName ?? entry.actor?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {entry.action}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {entry.targetType} · {entry.targetId}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {entry.ipAddress ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={5}
                >
                  No audit entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
