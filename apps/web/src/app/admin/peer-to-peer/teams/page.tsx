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
          <h1 className="text-2xl font-semibold text-zinc-900">Teams</h1>
          <p className="text-sm text-zinc-600">
            Organize groups of peer-to-peer fundraisers.
          </p>
        </div>
        <Link
          href="/admin/peer-to-peer/teams/new"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          New team
        </Link>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">Campaign</th>
              <th className="px-4 py-3 font-semibold text-zinc-700">
                Fundraisers
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.length ? (
              teams.map((team) => (
                <tr key={team.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Link
                      href={`/admin/peer-to-peer/teams/${team.id}`}
                      className="text-zinc-900 hover:text-zinc-700"
                    >
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {team.campaign?.name ?? "N/A"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {team._count.fundraisers}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500"
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
