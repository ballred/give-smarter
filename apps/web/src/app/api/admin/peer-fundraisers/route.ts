import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type PeerFundraiserPayload = {
  campaignId?: string;
  name?: string;
  slug?: string;
  story?: string;
  goalAmount?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  teamId?: string;
  classroomId?: string;
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    throw new Error("campaign_not_found");
  }

  return campaign.orgId;
}

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fundraisers = await prisma.peerFundraiser.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: fundraisers });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PeerFundraiserPayload;

  try {
    body = (await request.json()) as PeerFundraiserPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const slug = normalizeSlug(body.slug?.trim() || body.name);

  if (!slug) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  let orgId: string;

  try {
    orgId = await ensureCampaign(body.campaignId);
  } catch {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  if (body.teamId) {
    const team = await prisma.peerFundraisingTeam.findUnique({
      where: { id: body.teamId },
      select: { campaignId: true },
    });
    if (!team || team.campaignId !== body.campaignId) {
      return NextResponse.json({ error: "team_invalid" }, { status: 400 });
    }
  }

  if (body.classroomId) {
    const classroom = await prisma.peerFundraisingClassroom.findUnique({
      where: { id: body.classroomId },
      select: { campaignId: true },
    });
    if (!classroom || classroom.campaignId !== body.campaignId) {
      return NextResponse.json({ error: "classroom_invalid" }, { status: 400 });
    }
  }

  const fundraiser = await prisma.peerFundraiser.create({
    data: {
      orgId,
      campaignId: body.campaignId,
      name: body.name,
      slug,
      story: body.story ?? null,
      goalAmount: body.goalAmount ?? null,
      status: body.status ?? "PUBLISHED",
      teamId: body.teamId ?? null,
      classroomId: body.classroomId ?? null,
    },
  });

  return NextResponse.json({ data: fundraiser }, { status: 201 });
}
