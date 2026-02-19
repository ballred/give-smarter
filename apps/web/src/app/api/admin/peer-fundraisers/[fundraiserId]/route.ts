import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PeerFundraiserUpdate = {
  name?: string;
  slug?: string;
  story?: string;
  goalAmount?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  teamId?: string | null;
  classroomId?: string | null;
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fundraiserId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fundraiserId } = await params;

  const fundraiser = await prisma.peerFundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: fundraiser });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fundraiserId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fundraiserId } = await params;

  let body: PeerFundraiserUpdate;

  try {
    body = (await request.json()) as PeerFundraiserUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const beforeFundraiser = await prisma.peerFundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!beforeFundraiser) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = { campaignId: beforeFundraiser.campaignId };

  if (body.teamId) {
    const team = await prisma.peerFundraisingTeam.findUnique({
      where: { id: body.teamId },
      select: { campaignId: true },
    });
    if (!team || team.campaignId !== existing.campaignId) {
      return NextResponse.json({ error: "team_invalid" }, { status: 400 });
    }
  }

  if (body.classroomId) {
    const classroom = await prisma.peerFundraisingClassroom.findUnique({
      where: { id: body.classroomId },
      select: { campaignId: true },
    });
    if (!classroom || classroom.campaignId !== existing.campaignId) {
      return NextResponse.json({ error: "classroom_invalid" }, { status: 400 });
    }
  }

  const data: PeerFundraiserUpdate = {
    ...body,
  };

  if (body.slug || body.name) {
    const base = body.slug ?? body.name ?? "";
    data.slug = normalizeSlug(base);
  }

  const fundraiser = await prisma.peerFundraiser.update({
    where: { id: fundraiserId },
    data: {
      name: data.name,
      slug: data.slug,
      story: data.story ?? undefined,
      goalAmount: data.goalAmount ?? undefined,
      status: data.status ?? undefined,
      teamId: data.teamId === undefined ? undefined : data.teamId,
      classroomId: data.classroomId === undefined ? undefined : data.classroomId,
    },
  });

  await logAuditEntry({
    orgId: fundraiser.orgId,
    action: "peer_fundraiser.update",
    targetType: "PeerFundraiser",
    targetId: fundraiserId,
    beforeData: beforeFundraiser,
    afterData: fundraiser,
  });

  return NextResponse.json({ data: fundraiser });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fundraiserId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fundraiserId } = await params;

  const fundraiser = await prisma.peerFundraiser.findUnique({
    where: { id: fundraiserId },
  });

  if (!fundraiser) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.peerFundraiser.delete({
    where: { id: fundraiserId },
  });

  await logAuditEntry({
    orgId: fundraiser.orgId,
    action: "peer_fundraiser.delete",
    targetType: "PeerFundraiser",
    targetId: fundraiserId,
    beforeData: fundraiser,
  });

  return NextResponse.json({ ok: true });
}
