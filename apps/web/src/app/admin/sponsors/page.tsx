import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    include: {
      organization: { select: { publicName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Sponsors</h1>
          <p className="text-sm text-stone-600">
            Manage sponsor profiles and placement rules.
          </p>
        </div>
        <Link
          href="/admin/sponsors/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          New sponsor
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Level</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Org</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length ? (
              sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      href={`/admin/sponsors/${sponsor.id}`}
                      className="text-stone-900 hover:text-stone-700"
                    >
                      {sponsor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {sponsor.level ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {sponsor.organization.publicName}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={3}
                >
                  No sponsors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
