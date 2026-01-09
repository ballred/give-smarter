import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PaddleRaiseLevelPayload = {
  campaignId?: string;
  label?: string;
  amount?: number;
  matchSponsorName?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const levels = await prisma.paddleRaiseLevel.findMany({
    orderBy: [{ campaignId: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ data: levels });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PaddleRaiseLevelPayload;

  try {
    body = (await request.json()) as PaddleRaiseLevelPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.label || typeof body.amount !== "number") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!Number.isFinite(body.amount) || body.amount < 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const level = await prisma.paddleRaiseLevel.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      label: body.label,
      amount: Math.round(body.amount * 100),
      matchSponsorName: body.matchSponsorName ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });

  await logAuditEntry({
    orgId: campaign.orgId,
    action: "paddle_raise_level.create",
    targetType: "PaddleRaiseLevel",
    targetId: level.id,
    afterData: level,
  });

  return NextResponse.json({ data: level }, { status: 201 });
}
