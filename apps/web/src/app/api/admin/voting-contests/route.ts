import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type VotingContestPayload = {
  campaignId?: string;
  name?: string;
  startsAt?: string;
  endsAt?: string;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contests = await prisma.votingContest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: contests });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: VotingContestPayload;

  try {
    body = (await request.json()) as VotingContestPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.name) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const contest = await prisma.votingContest.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  return NextResponse.json({ data: contest }, { status: 201 });
}
