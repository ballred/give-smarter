import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function VotingContestDetailPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const resolvedParams = await params;
  const contest = await prisma.votingContest.findUnique({
    where: { id: resolvedParams.contestId },
    include: {
      campaign: { select: { name: true } },
      candidates: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contest) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            {contest.campaign?.name ?? "Campaign"}
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">
            {contest.name}
          </h1>
          <p className="text-sm text-stone-600">Status: {contest.status}</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-700 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
          href={`/admin/voting/${contest.id}/candidates/new`}
        >
          New candidate
        </Link>
      </header>

      <div className="rounded-2xl border border-amber-200/60 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-amber-200/60 bg-amber-50/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700">
                Sponsor
              </th>
              <th className="px-4 py-3 font-semibold text-stone-700">Photo</th>
            </tr>
          </thead>
          <tbody>
            {contest.candidates.length ? (
              contest.candidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-amber-100">
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {candidate.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {candidate.sponsorName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {candidate.photoUrl ? "Yes" : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-center text-stone-500"
                  colSpan={3}
                >
                  No candidates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
