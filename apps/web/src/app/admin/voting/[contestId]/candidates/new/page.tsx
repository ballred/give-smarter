import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createVoteCandidate } from "./voting-candidate-actions";

export default async function NewVotingCandidatePage({
  params,
}: {
  params: { contestId: string };
}) {
  const contest = await prisma.votingContest.findUnique({
    where: { id: params.contestId },
    select: { id: true, name: true },
  });

  if (!contest) {
    redirect("/admin/voting");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Add candidate to {contest.name}
        </h1>
        <p className="text-sm text-zinc-600">
          Provide candidate details for the voting contest.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          const id = await createVoteCandidate(contest.id, formData);
          redirect(`/admin/voting/${contest.id}?created=${id}`);
        }}
      >
        <label className="block text-sm font-semibold text-zinc-700">
          Candidate name
          <input
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <label className="block text-sm font-semibold text-zinc-700">
          Description
          <textarea
            name="description"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Photo URL
            <input
              name="photoUrl"
              type="url"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Sponsor name
            <input
              name="sponsorName"
              type="text"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Save candidate
        </button>
      </form>
    </div>
  );
}
