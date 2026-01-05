import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function VolunteersPage() {
  const shifts = await prisma.volunteerShift.findMany({
    include: {
      campaign: { select: { name: true } },
      _count: { select: { signups: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Volunteers</h1>
          <p className="text-sm text-zinc-600">
            Create volunteer shifts and manage signups.
          </p>
        </div>
        <Link
          href="/admin/volunteers/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          New shift
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Shift</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Signups
              </th>
            </tr>
          </thead>
          <tbody>
            {shifts.length ? (
              shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      href={`/admin/volunteers/${shift.id}`}
                      className="text-zinc-900 hover:text-zinc-700"
                    >
                      {shift.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {shift.campaign?.name ?? "Campaign"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {shift._count.signups}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={3}
                >
                  No shifts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
