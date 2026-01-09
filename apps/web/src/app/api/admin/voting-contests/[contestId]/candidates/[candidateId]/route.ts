import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type CandidateUpdatePayload = {
  name?: string;
  description?: string | null;
  photoUrl?: string | null;
  sponsorName?: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contestId: string; candidateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { contestId, candidateId } = await params;

  const candidate = await prisma.voteCandidate.findFirst({
    where: { id: candidateId, contestId: contestId },
  });

  if (!candidate) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: candidate });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contestId: string; candidateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;

  let body: CandidateUpdatePayload;

  try {
    body = (await request.json()) as CandidateUpdatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl;
  if (body.sponsorName !== undefined) data.sponsorName = body.sponsorName;

  const candidate = await prisma.voteCandidate.update({
    where: { id: candidateId },
    data,
  });

  return NextResponse.json({ data: candidate });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ contestId: string; candidateId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;

  await prisma.voteCandidate.delete({
    where: { id: candidateId },
  });

  return NextResponse.json({ ok: true });
}
