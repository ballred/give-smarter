import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type VolunteerShiftPayload = {
  campaignId?: string;
  name?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
};

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shifts = await prisma.volunteerShift.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: shifts });
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: VolunteerShiftPayload;

  try {
    body = (await request.json()) as VolunteerShiftPayload;
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

  const shift = await prisma.volunteerShift.create({
    data: {
      orgId: campaign.orgId,
      campaignId: body.campaignId,
      name: body.name,
      description: body.description ?? null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      capacity: body.capacity ?? null,
    },
  });

  return NextResponse.json({ data: shift }, { status: 201 });
}
