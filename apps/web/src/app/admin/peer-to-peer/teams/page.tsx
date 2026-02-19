import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function TeamsPage() {
  const teams = await prisma.peerFundraisingTeam.findMany({
    include: {
      campaign: { select: { name: true } },
      _count: { select: { fundraisers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Teams</h1>
          <p className="text-sm text-stone-600">
            Organize groups of peer-to-peer fundraisers.
          </p>
        </div>
        <Link
          href="/admin/peer-to-peer/teams/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          New team
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Fundraisers
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.length ? (
              teams.map((team) => (
                <tr key={team.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    <Link
                      href={`/admin/peer-to-peer/teams/${team.id}`}
                      className="text-stone-900 hover:text-stone-700"
                    >
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {team.campaign?.name ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {team._count.fundraisers}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={3}
                >
                  No teams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
