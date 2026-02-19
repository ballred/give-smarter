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
          <h1 className="text-2xl font-semibold text-stone-900">Households</h1>
          <p className="text-sm text-stone-600">
            Group donors into households for unified giving history.
          </p>
        </div>
        <Link
          href="/admin/households/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          New household
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Members
              </th>
            </tr>
          </thead>
          <tbody>
            {households.length ? (
              households.map((household) => (
                <tr key={household.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      href={`/admin/households/${household.id}`}
                      className="text-stone-900 hover:text-stone-700"
                    >
                      {household.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {household.organization.publicName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {household._count.memberships}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
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
