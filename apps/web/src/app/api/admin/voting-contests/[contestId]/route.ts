import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type VotingContestUpdatePayload = {
  name?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: "DRAFT" | "ACTIVE" | "CLOSED";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { contestId } = await params;

  const contest = await prisma.votingContest.findUnique({
    where: { id: contestId },
  });

  if (!contest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: contest });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { contestId } = await params;

  let body: VotingContestUpdatePayload;

  try {
    body = (await request.json()) as VotingContestUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeContest = await prisma.votingContest.findUnique({
    where: { id: contestId },
  });

  if (!beforeContest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.startsAt !== undefined) {
    data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  }
  if (body.endsAt !== undefined) {
    data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  }
  if (body.status !== undefined) data.status = body.status;

  const contest = await prisma.votingContest.update({
    where: { id: contestId },
    data,
  });

  await logAuditEntry({
    orgId: contest.orgId,
    action: "voting_contest.update",
    targetType: "VotingContest",
    targetId: contestId,
    beforeData: beforeContest,
    afterData: contest,
  });

  return NextResponse.json({ data: contest });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { contestId } = await params;

  const contest = await prisma.votingContest.findUnique({
    where: { id: contestId },
  });

  if (!contest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.votingContest.delete({ where: { id: contestId } });

  await logAuditEntry({
    orgId: contest.orgId,
    action: "voting_contest.delete",
    targetType: "VotingContest",
    targetId: contestId,
    beforeData: contest,
  });

  return NextResponse.json({ ok: true });
}
