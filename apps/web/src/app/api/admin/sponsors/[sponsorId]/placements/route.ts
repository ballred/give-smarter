import { NextResponse } from "next/server";
import { auth } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";

type PlacementPayload = {
  campaignId?: string;
  placementType?: string;
  placementRefId?: string;
  sortOrder?: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sponsorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sponsorId } = await params;

  const placements = await prisma.sponsorPlacement.findMany({
    where: { sponsorId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: placements });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sponsorId } = await params;

  let body: PlacementPayload;

  try {
    body = (await request.json()) as PlacementPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.campaignId || !body.placementType || !body.placementRefId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    select: { orgId: true },
  });

  if (!sponsor) {
    return NextResponse.json({ error: "sponsor_not_found" }, { status: 404 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
    select: { orgId: true },
  });

  if (!campaign || campaign.orgId !== sponsor.orgId) {
    return NextResponse.json({ error: "campaign_invalid" }, { status: 400 });
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      orgId: sponsor.orgId,
      sponsorId,
      campaignId: body.campaignId,
      placementType: body.placementType,
      placementRefId: body.placementRefId,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  await logAuditEntry({
    orgId: sponsor.orgId,
    action: "sponsor_placement.create",
    targetType: "SponsorPlacement",
    targetId: placement.id,
    afterData: placement,
  });

  return NextResponse.json({ data: placement }, { status: 201 });
}
