import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PeerTeamPayload = {
  campaignId?: string;
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
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const teams = await prisma.peerFundraisingTeam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: teams });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PeerTeamPayload;

  try {
    body = (await request.json()) as PeerTeamPayload;
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

  const team = await prisma.peerFundraisingTeam.create({
    data: {
      orgId,
      campaignId: body.campaignId,
      name: body.name,
      slug,
      story: body.story ?? null,
      goalAmount: body.goalAmount ?? null,
    },
  });

  await logAuditEntry({
    orgId,
    action: "peer_team.create",
    targetType: "PeerFundraisingTeam",
    targetId: team.id,
    afterData: team,
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
