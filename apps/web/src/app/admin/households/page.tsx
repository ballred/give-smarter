import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HouseholdsPage() {
  const households = await prisma.household.findMany({
    include: {
      organization: { select: { publicName: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Households</h1>
          <p className="text-sm text-zinc-600">
            Group donors into households for unified giving history.
          </p>
        </div>
        <Link
          href="/admin/households/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          New household
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Org</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Members
              </th>
            </tr>
          </thead>
          <tbody>
            {households.length ? (
              households.map((household) => (
                <tr key={household.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      href={`/admin/households/${household.id}`}
                      className="text-zinc-900 hover:text-zinc-700"
                    >
                      {household.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {household.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {household._count.memberships}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
                  colSpan={3}
                >
                  No households yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
