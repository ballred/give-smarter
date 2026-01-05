import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type PeerClassroomPayload = {
  campaignId?: string;
  name?: string;
  slug?: string;
  grade?: string;
  teacherName?: string;
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
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const classrooms = await prisma.peerFundraisingClassroom.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: classrooms });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PeerClassroomPayload;

  try {
    body = (await request.json()) as PeerClassroomPayload;
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

  const classroom = await prisma.peerFundraisingClassroom.create({
    data: {
      orgId,
      campaignId: body.campaignId,
      name: body.name,
      slug,
      grade: body.grade ?? null,
      teacherName: body.teacherName ?? null,
      story: body.story ?? null,
      goalAmount: body.goalAmount ?? null,
    },
  });

  return NextResponse.json({ data: classroom }, { status: 201 });
}
