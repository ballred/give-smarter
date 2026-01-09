import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ROUTE_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

type KeywordRoutePayload = {
  orgId?: string;
  keyword?: string;
  campaignId?: string | null;
  replyMessage?: string | null;
  status?: string;
};

function normalizeKeyword(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const routes = await prisma.keywordRoute.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: routes });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: KeywordRoutePayload;

  try {
    body = (await request.json()) as KeywordRoutePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.orgId || !body.keyword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const keyword = normalizeKeyword(body.keyword);

  if (!keyword) {
    return NextResponse.json({ error: "invalid_keyword" }, { status: 400 });
  }

  if (body.status && !ROUTE_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: body.orgId },
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  let campaignId: string | null = null;

  if (body.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: { orgId: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
    }

    if (campaign.orgId !== body.orgId) {
      return NextResponse.json({ error: "campaign_org_mismatch" }, { status: 400 });
    }

    campaignId = body.campaignId;
  }

  const route = await prisma.keywordRoute.create({
    data: {
      orgId: body.orgId,
      keyword,
      campaignId,
      replyMessage: body.replyMessage ?? null,
      status: (body.status ?? "ACTIVE") as "ACTIVE" | "INACTIVE",
    },
  });

  return NextResponse.json({ data: route }, { status: 201 });
}
