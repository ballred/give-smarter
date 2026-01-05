import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type CandidatePayload = {
  name?: string;
  description?: string | null;
  photoUrl?: string | null;
  sponsorName?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: { contestId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.voteCandidate.findMany({
    where: { contestId: params.contestId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: candidates });
}

export async function POST(
  request: Request,
  { params }: { params: { contestId: string } },
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CandidatePayload;

  try {
    body = (await request.json()) as CandidatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const contest = await prisma.votingContest.findUnique({
    where: { id: params.contestId },
    select: { orgId: true },
  });

  if (!contest) {
    return NextResponse.json({ error: "contest_not_found" }, { status: 404 });
  }

  const candidate = await prisma.voteCandidate.create({
    data: {
      orgId: contest.orgId,
      contestId: params.contestId,
      name: body.name,
      description: body.description ?? null,
      photoUrl: body.photoUrl ?? null,
      sponsorName: body.sponsorName ?? null,
    },
  });

  return NextResponse.json({ data: candidate }, { status: 201 });
}
