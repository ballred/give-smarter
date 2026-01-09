import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

  await prisma.votingContest.delete({ where: { id: contestId } });

  return NextResponse.json({ ok: true });
}
