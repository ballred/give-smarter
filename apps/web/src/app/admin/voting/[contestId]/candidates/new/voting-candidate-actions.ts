import { prisma } from "@/lib/db";

export async function createVoteCandidate(
  contestId: string,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const sponsorName = String(formData.get("sponsorName") ?? "").trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  const contest = await prisma.votingContest.findUnique({
    where: { id: contestId },
    select: { orgId: true },
  });

  if (!contest) {
    throw new Error("Contest not found.");
  }

  const candidate = await prisma.voteCandidate.create({
    data: {
      orgId: contest.orgId,
      contestId,
      name,
      description: description || null,
      photoUrl: photoUrl || null,
      sponsorName: sponsorName || null,
    },
  });

  return candidate.id;
}
