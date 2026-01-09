import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PeerTeamUpdate = {
  name?: string;
  slug?: string;
  story?: string;
  goalAmount?: number;
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  const team = await prisma.peerFundraisingTeam.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: team });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  let body: PeerTeamUpdate;

  try {
    body = (await request.json()) as PeerTeamUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeTeam = await prisma.peerFundraisingTeam.findUnique({
    where: { id: teamId },
  });

  if (!beforeTeam) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: PeerTeamUpdate = {
    ...body,
  };

  if (body.slug || body.name) {
    const base = body.slug ?? body.name ?? "";
    data.slug = normalizeSlug(base);
  }

  const team = await prisma.peerFundraisingTeam.update({
    where: { id: teamId },
    data: {
      name: data.name,
      slug: data.slug,
      story: data.story ?? undefined,
      goalAmount: data.goalAmount ?? undefined,
    },
  });

  await logAuditEntry({
    orgId: team.orgId,
    action: "peer_team.update",
    targetType: "PeerFundraisingTeam",
    targetId: teamId,
    beforeData: beforeTeam,
    afterData: team,
  });

  return NextResponse.json({ data: team });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  const team = await prisma.peerFundraisingTeam.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.peerFundraisingTeam.delete({
    where: { id: teamId },
  });

  await logAuditEntry({
    orgId: team.orgId,
    action: "peer_team.delete",
    targetType: "PeerFundraisingTeam",
    targetId: teamId,
    beforeData: team,
  });

  return NextResponse.json({ ok: true });
}
